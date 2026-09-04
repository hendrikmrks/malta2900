import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ errorCode: "NOT_LOGGED_IN" }, { status: 401 });
  }

  await prisma.playerState.update({
    where: { userId },
    data: { onboardingDone: false },
  });

  return NextResponse.json({ ok: true });
}
