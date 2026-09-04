import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

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
    return NextResponse.json({ errorCode: "INVALID_POSITION" }, { status: 400 });
  }

  const playerState = await prisma.playerState.findUnique({
    where: { userId },
    include: { pendingActions: { take: 1 } },
  });
  if (!playerState) {
    return NextResponse.json({ errorCode: "NO_PLAYER" }, { status: 404 });
  }
  // Waehrend eine Aktion laeuft, ist die Position gesperrt - nicht nur clientseitig
  // (siehe Dashboard.tsx handleGroundClick), sondern auch hier durchgesetzt, damit
  // ein Gebiet nicht ohne Abbruch verlassen werden kann.
  if (playerState.pendingActions.length > 0) {
    return NextResponse.json({ errorCode: "BUSY" }, { status: 409 });
  }

  await prisma.playerState.update({
    where: { userId },
    data: {
      posX: Math.round(clamp(x, 0, 100)),
      posY: Math.round(clamp(y, 0, 100)),
    },
  });

  return NextResponse.json({ ok: true });
}
