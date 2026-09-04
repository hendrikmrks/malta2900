import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ errorCode: "NOT_LOGGED_IN" }, { status: 401 });
  }

  const playerState = await prisma.playerState.findUnique({
    where: { userId },
    include: { pendingActions: { take: 1 } },
  });

  if (!playerState) {
    return NextResponse.json({ errorCode: "NO_PLAYER" }, { status: 404 });
  }

  const action = playerState.pendingActions[0];
  if (!action) {
    return NextResponse.json({ errorCode: "NO_ACTIVE_ACTION" }, { status: 409 });
  }

  try {
    // Loeschen ohne Effekt anzuwenden - Abbruch bedeutet, dass die Aktion
    // nicht fertig wird. Bereits eingesetzte Rohstoffe (z.B. Saatgut beim
    // Gemueseanbau) werden dabei bewusst NICHT erstattet.
    await prisma.pendingAction.delete({ where: { id: action.id } });
  } catch (err) {
    // Race: der Worker hat die Aktion zwischen Lesen und Loeschen bereits
    // abgeschlossen - dann gibt es nichts mehr abzubrechen.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ errorCode: "ACTION_ALREADY_COMPLETED" }, { status: 409 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
}
