import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { FIREPLACE_WOOD_COST, XP_CRAFT, levelForXp } from "@/lib/game";

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

  if (playerState.hasFireplace) {
    return NextResponse.json({ errorCode: "FIREPLACE_ALREADY_BUILT" }, { status: 409 });
  }

  if (playerState.woodCount < FIREPLACE_WOOD_COST) {
    return NextResponse.json({ errorCode: "NOT_ENOUGH_WOOD" }, { status: 409 });
  }

  const xp = playerState.xp + XP_CRAFT;
  await prisma.playerState.update({
    where: { id: playerState.id },
    data: {
      woodCount: { decrement: FIREPLACE_WOOD_COST },
      hasFireplace: true,
      fireplaceX: Math.round(clamp(x, 0, 100)),
      fireplaceY: Math.round(clamp(y, 0, 100)),
      xp,
      level: levelForXp(xp),
    },
  });

  return NextResponse.json({ ok: true });
}
