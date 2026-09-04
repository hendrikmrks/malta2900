import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { STOREHOUSE_STONE_COST, STOREHOUSE_WOOD_COST, XP_CRAFT, levelForXp } from "@/lib/game";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ errorCode: "NOT_LOGGED_IN" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const x = typeof body?.x === "number" ? body.x : null;
  const y = typeof body?.y === "number" ? body.y : null;
  if (x === null || y === null || !Number.isFinite(x) || !Number.isFinite(y)) {
    return NextResponse.json({ errorCode: "NO_BUILD_SPOT" }, { status: 400 });
  }

  const playerState = await prisma.playerState.findUnique({ where: { userId } });

  if (!playerState) {
    return NextResponse.json({ errorCode: "NO_PLAYER" }, { status: 404 });
  }

  if (playerState.hasStorehouse) {
    return NextResponse.json({ errorCode: "STOREHOUSE_ALREADY_BUILT" }, { status: 409 });
  }

  if (playerState.woodCount < STOREHOUSE_WOOD_COST) {
    return NextResponse.json({ errorCode: "NOT_ENOUGH_WOOD" }, { status: 409 });
  }
  if (playerState.stoneCount < STOREHOUSE_STONE_COST) {
    return NextResponse.json({ errorCode: "NOT_ENOUGH_STONE" }, { status: 409 });
  }

  const xp = playerState.xp + XP_CRAFT;
  await prisma.playerState.update({
    where: { id: playerState.id },
    data: {
      woodCount: { decrement: STOREHOUSE_WOOD_COST },
      stoneCount: { decrement: STOREHOUSE_STONE_COST },
      hasStorehouse: true,
      storehouseX: Math.round(clamp(x, 0, 100)),
      storehouseY: Math.round(clamp(y, 0, 100)),
      xp,
      level: levelForXp(xp),
    },
  });

  return NextResponse.json({ ok: true });
}
