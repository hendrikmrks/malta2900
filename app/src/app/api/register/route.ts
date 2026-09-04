import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/locales";
import { generateIslandRegions } from "@/lib/islandGen";
import { DEFAULT_SHELTER_POSITION, STARTING_COIN_COUNT } from "@/lib/game";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const locale = isLocale(body?.locale) ? body.locale : DEFAULT_LOCALE;

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ errorCode: "INVALID_EMAIL" }, { status: 400 });
  }
  if (username.length < 3 || password.length < 6) {
    return NextResponse.json({ errorCode: "INVALID_REGISTRATION" }, { status: 400 });
  }

  const [existingEmail, existingUsername] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { username } }),
  ]);
  if (existingEmail) {
    return NextResponse.json({ errorCode: "EMAIL_TAKEN" }, { status: 409 });
  }
  if (existingUsername) {
    return NextResponse.json({ errorCode: "USERNAME_TAKEN" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      locale,
      playerState: {
        create: {
          hunger: 100,
          thirst: 100,
          energy: 100,
          // Jeder Spieler startet mit einer kostenlosen Basis-Huette - kein
          // "wilder" Schlaf ohne Standort mehr (siehe api/actions/sleep).
          hasShelter: true,
          shelterX: DEFAULT_SHELTER_POSITION.x,
          shelterY: DEFAULT_SHELTER_POSITION.y,
          // Kleiner Startbestand, damit der Haendler sofort nutzbar ist.
          coinCount: STARTING_COIN_COUNT,
          mapRegions: { create: generateIslandRegions() },
        },
      },
    },
  });

  return NextResponse.json({ ok: true });
}
