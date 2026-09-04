import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import {
  effectiveMerchantSellPrice,
  isTradableResourceType,
  getResourceAmount,
  resourceDelta,
} from "@/lib/game";
import { getWorldState } from "@/lib/world";

// Verkauf an den Haendler: sofort, garantiert verfuegbar, unabhaengig davon,
// ob gerade andere Spieler online sind - der eigentliche "Marktplatz mit
// Angeboten" bleibt zusaetzlich fuer bessere, verhandelte Preise bestehen.
export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ errorCode: "NOT_LOGGED_IN" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const resource = body?.resource;
  const amount = Number(body?.amount);

  if (!isTradableResourceType(resource)) {
    return NextResponse.json({ errorCode: "INVALID_RESOURCE" }, { status: 400 });
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json({ errorCode: "INVALID_AMOUNTS" }, { status: 400 });
  }

  const world = await getWorldState();

  try {
    await prisma.$transaction(async (tx) => {
      const player = await tx.playerState.findUnique({ where: { userId } });
      if (!player) throw new Error("NO_PLAYER");
      if (getResourceAmount(player, resource) < amount) throw new Error("INSUFFICIENT");

      const coinsEarned = effectiveMerchantSellPrice(resource, world.currencySellMultiplier) * amount;
      await tx.playerState.update({
        where: { id: player.id },
        data: {
          ...resourceDelta(resource, -amount),
          coinCount: { increment: coinsEarned },
        },
      });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "INSUFFICIENT") {
      return NextResponse.json({ errorCode: "NOT_ENOUGH_FOR_TRADE" }, { status: 409 });
    }
    if (message === "NO_PLAYER") {
      return NextResponse.json({ errorCode: "NO_PLAYER" }, { status: 404 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
}
