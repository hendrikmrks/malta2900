import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { USERNAME_COOLDOWN_MS } from "@/lib/game";

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ errorCode: "NOT_LOGGED_IN" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";

  if (username.length < 3) {
    return NextResponse.json({ errorCode: "USERNAME_TOO_SHORT" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, usernameChangedAt: true },
  });
  if (!user) {
    return NextResponse.json({ errorCode: "NO_PLAYER" }, { status: 404 });
  }

  // Unveraendert eingereicht - kein Fehler, aber auch kein Cooldown-Verbrauch.
  if (username === user.username) {
    return NextResponse.json({ ok: true, username });
  }

  if (user.usernameChangedAt) {
    const nextAllowedAt = new Date(user.usernameChangedAt.getTime() + USERNAME_COOLDOWN_MS);
    if (nextAllowedAt.getTime() > Date.now()) {
      return NextResponse.json(
        { errorCode: "USERNAME_COOLDOWN", nextAllowedAt: nextAllowedAt.toISOString() },
        { status: 409 }
      );
    }
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ errorCode: "USERNAME_TAKEN" }, { status: 409 });
  }

  const now = new Date();
  await prisma.user.update({
    where: { id: userId },
    data: { username, usernameChangedAt: now },
  });

  return NextResponse.json({ ok: true, username });
}
