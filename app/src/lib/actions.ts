import { Prisma, PlayerState } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isNearPosition, type Position, type RegionType } from "@/lib/game";

/**
 * `code` ist ein stabiler, sprachunabhaengiger Fehler-Schluessel (siehe
 * Dictionary["errors"]) - die Uebersetzung passiert ausschliesslich im
 * Client anhand der aktuellen Sprache, nie hier auf dem Server.
 */
export class ActionError extends Error {
  status: number;
  code: string;
  meta?: Record<string, string>;
  constructor(code: string, status = 409, meta?: Record<string, string>) {
    super(code);
    this.status = status;
    this.code = code;
    this.meta = meta;
  }
}

type TxClient = Prisma.TransactionClient;

/**
 * Startet eine zeitbasierte Aktion (PendingAction) fuer den eingeloggten
 * Spieler. Lehnt ab, wenn bereits eine Aktion laeuft - pro Spieler ist immer
 * nur eine PendingAction gleichzeitig erlaubt. `applyCost` kann innerhalb
 * derselben Transaktion Ressourcen validieren/abziehen (z.B. Feigen als
 * Saatgut), damit Pruefung und Abzug atomar mit dem Start passieren.
 * `requireNear` lehnt ab, wenn der Spieler nicht in der Naehe einer punktgenauen
 * Karten-Station (z.B. dem selbst gebauten Unterschlupf) steht.
 * `requireInRegion` lehnt stattdessen ab, wenn der Spieler nicht innerhalb
 * eines auf der eigenen Insel vorhandenen Gebiets des angegebenen Typs steht -
 * fehlt das Gebiet komplett auf der Insel, gibt es einen eigenen Fehlercode
 * (NO_REGION_ON_ISLAND), damit der Client "das gibt es hier nicht, handel
 * dafuer" von "lauf noch naeher hin" unterscheiden kann. Beides wird
 * serverseitig durchgesetzt, nicht nur clientseitig angezeigt.
 */
export async function startTimedAction({
  userId,
  type,
  durationMs,
  applyCost,
  requireNear,
  nearStationKey,
  requireInRegion,
}: {
  userId: string;
  type: string;
  /** Fester Wert oder Funktion, die die Dauer aus dem Spielerzustand ableitet
   * (z.B. abhaengig vom Level) - wird atomar mit demselben Spieler-Read berechnet. */
  durationMs: number | ((player: PlayerState) => number);
  applyCost?: (tx: TxClient, player: PlayerState) => Promise<void>;
  requireNear?: Position | null | ((player: PlayerState) => Position | null);
  /** Stations-Schluessel (z.B. "sleep") fuer die TOO_FAR_AWAY-Meldung -
   * der Client uebersetzt daraus den lokalisierten Stationsnamen. */
  nearStationKey?: string;
  /** Gebietstyp (z.B. "forest"), innerhalb dessen die Aktion gestartet werden darf. */
  requireInRegion?: RegionType;
}) {
  await prisma.$transaction(async (tx) => {
    const player = await tx.playerState.findUnique({
      where: { userId },
      include: { pendingActions: { take: 1 } },
    });

    if (!player) {
      throw new ActionError("NO_PLAYER", 404);
    }
    if (player.pendingActions.length > 0) {
      throw new ActionError("BUSY");
    }

    if (requireInRegion) {
      const regions = await tx.mapRegion.findMany({
        where: { playerId: player.id, type: requireInRegion },
      });
      if (regions.length === 0) {
        throw new ActionError("NO_REGION_ON_ISLAND", 409, { region: requireInRegion });
      }
      const inside = regions.some((r) =>
        isNearPosition({ x: player.posX, y: player.posY }, { x: r.x, y: r.y }, r.radius)
      );
      if (!inside) {
        throw new ActionError("TOO_FAR_AWAY", 409, { station: nearStationKey ?? requireInRegion });
      }
    } else {
      const targetPos = typeof requireNear === "function" ? requireNear(player) : requireNear;
      if (targetPos && !isNearPosition({ x: player.posX, y: player.posY }, targetPos)) {
        throw new ActionError("TOO_FAR_AWAY", 409, { station: nearStationKey ?? "" });
      }
    }

    if (applyCost) {
      await applyCost(tx, player);
    }

    const resolvedDurationMs =
      typeof durationMs === "function" ? durationMs(player) : durationMs;

    const now = new Date();
    await tx.pendingAction.create({
      data: {
        playerId: player.id,
        type,
        startedAt: now,
        readyAt: new Date(now.getTime() + resolvedDurationMs),
      },
    });
  });
}
