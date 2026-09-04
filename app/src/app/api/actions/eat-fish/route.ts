import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { EAT_FISH_HUNGER_GAIN } from "@/lib/game";

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ errorCode: "NOT_LOGGED_IN" }, { status: 401 });
  }

  const playerState = await prisma.playerState.findUnique({ where: { userId } });

  if (!playerState) {
    return NextResponse.json({ errorCode: "NO_PLAYER" }, { status: 404 });
  }

  if (playerState.fishCount <= 0) {
    return NextResponse.json({ errorCode: "NO_FISH" }, { status: 409 });
  }

  await prisma.playerState.update({
    where: { id: playerState.id },
    data: {
      hunger: Math.min(100, playerState.hunger + EAT_FISH_HUNGER_GAIN),
      fishCount: { decrement: 1 },
    },
  });

  return NextResponse.json({ ok: true });
}
