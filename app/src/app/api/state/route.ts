import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { getWorldState } from "@/lib/world";
import { XP_PER_LEVEL } from "@/lib/game";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ errorCode: "NOT_LOGGED_IN" }, { status: 401 });
  }

  const playerState = await prisma.playerState.findUnique({
    where: { userId },
    include: {
      pendingActions: {
        orderBy: { readyAt: "asc" },
        take: 1,
      },
      mapRegions: true,
      pathTiles: true,
    },
  });

  if (!playerState) {
    return NextResponse.json({ errorCode: "NO_PLAYER" }, { status: 404 });
  }

  const activeAction = playerState.pendingActions[0] ?? null;
  const world = await getWorldState();

  return NextResponse.json({
    hunger: playerState.hunger,
    thirst: playerState.thirst,
    energy: playerState.energy,
    figCount: playerState.figCount,
    woodCount: playerState.woodCount,
    waterCount: playerState.waterCount,
    vegetableCount: playerState.vegetableCount,
    fishCount: playerState.fishCount,
    stoneCount: playerState.stoneCount,
    coinCount: playerState.coinCount,
    regions: playerState.mapRegions.map((r) => ({
      type: r.type,
      x: r.x,
      y: r.y,
      radius: r.radius,
    })),
    hasFireplace: playerState.hasFireplace,
    fireplaceX: playerState.fireplaceX,
    fireplaceY: playerState.fireplaceY,
    hasShelter: playerState.hasShelter,
    shelterX: playerState.shelterX,
    shelterY: playerState.shelterY,
    shelterLevel: playerState.shelterLevel,
    hasWell: playerState.hasWell,
    wellX: playerState.wellX,
    wellY: playerState.wellY,
    hasGarden: playerState.hasGarden,
    gardenX: playerState.gardenX,
    gardenY: playerState.gardenY,
    hasStorehouse: playerState.hasStorehouse,
    storehouseX: playerState.storehouseX,
    storehouseY: playerState.storehouseY,
    pathTiles: playerState.pathTiles.map((t) => ({ x: t.x, y: t.y })),
    xp: playerState.xp,
    level: playerState.level,
    xpIntoLevel: playerState.xp % XP_PER_LEVEL,
    xpPerLevel: XP_PER_LEVEL,
    isNight: world.isNight,
    weather: world.weather,
    currencySellMultiplier: world.currencySellMultiplier,
    currencyBuyMultiplier: world.currencyBuyMultiplier,
    posX: playerState.posX,
    posY: playerState.posY,
    onboardingDone: playerState.onboardingDone,
    activeAction: activeAction
      ? {
          type: activeAction.type,
          startedAt: activeAction.startedAt,
          readyAt: activeAction.readyAt,
        }
      : null,
  });
}
