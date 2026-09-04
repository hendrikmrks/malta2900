import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { isLocale } from "@/lib/i18n/locales";

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ errorCode: "NOT_LOGGED_IN" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!isLocale(body?.locale)) {
    return NextResponse.json({ errorCode: "GENERIC" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { locale: body.locale },
  });

  return NextResponse.json({ ok: true });
}
