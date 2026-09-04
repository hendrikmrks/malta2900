import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import {
  MAX_SHELTER_LEVEL,
  XP_CRAFT,
  levelForXp,
  shelterUpgradeStoneCost,
  shelterUpgradeWoodCost,
} from "@/lib/game";

// Baut die Huette nicht mehr auf (jeder Spieler hat sie schon ab der
// Registrierung), sondern baut sie auf das naechste Level aus - kuerzere
// Schlafdauer als Belohnung (siehe shelterSleepDurationMs).
export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ errorCode: "NOT_LOGGED_IN" }, { status: 401 });
  }

  const playerState = await prisma.playerState.findUnique({ where: { userId } });

  if (!playerState) {
    return NextResponse.json({ errorCode: "NO_PLAYER" }, { status: 404 });
  }

  if (playerState.shelterLevel >= MAX_SHELTER_LEVEL) {
    return NextResponse.json({ errorCode: "SHELTER_MAX_LEVEL" }, { status: 409 });
  }

  const targetLevel = playerState.shelterLevel + 1;
  const woodCost = shelterUpgradeWoodCost(targetLevel);
  const stoneCost = shelterUpgradeStoneCost(targetLevel);

  if (playerState.woodCount < woodCost) {
    return NextResponse.json({ errorCode: "NOT_ENOUGH_WOOD" }, { status: 409 });
  }
  if (playerState.stoneCount < stoneCost) {
    return NextResponse.json({ errorCode: "NOT_ENOUGH_STONE" }, { status: 409 });
  }

  const xp = playerState.xp + XP_CRAFT;
  await prisma.playerState.update({
    where: { id: playerState.id },
    data: {
      woodCount: { decrement: woodCost },
      stoneCount: { decrement: stoneCost },
      shelterLevel: targetLevel,
      xp,
      level: levelForXp(xp),
    },
  });

  return NextResponse.json({ ok: true });
}
