import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { DRINK_WATER_THIRST_GAIN } from "@/lib/game";

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ errorCode: "NOT_LOGGED_IN" }, { status: 401 });
  }

  const playerState = await prisma.playerState.findUnique({ where: { userId } });

  if (!playerState) {
    return NextResponse.json({ errorCode: "NO_PLAYER" }, { status: 404 });
  }

  if (playerState.waterCount <= 0) {
    return NextResponse.json({ errorCode: "NO_WATER" }, { status: 409 });
  }

  await prisma.playerState.update({
    where: { id: playerState.id },
    data: {
      thirst: Math.min(100, playerState.thirst + DRINK_WATER_THIRST_GAIN),
      waterCount: { decrement: 1 },
    },
  });

  return NextResponse.json({ ok: true });
}
