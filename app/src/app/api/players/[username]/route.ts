import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { getWorldState } from "@/lib/world";

export async function GET(request: Request, { params }: { params: { username: string } }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ errorCode: "NOT_LOGGED_IN" }, { status: 401 });
  }

  const playerState = await prisma.playerState.findFirst({
    where: { user: { username: params.username } },
    include: {
      pendingActions: { orderBy: { readyAt: "asc" }, take: 1 },
      mapRegions: true,
      pathTiles: true,
    },
  });

  if (!playerState) {
    return NextResponse.json({ errorCode: "PLAYER_NOT_FOUND" }, { status: 404 });
  }

  const activeAction = playerState.pendingActions[0] ?? null;
  const world = await getWorldState();

  // Nur oeffentliche Lager-/Camp-Infos - keine Hunger/Durst/Energie-Werte
  // eines anderen Spielers preisgeben.
  return NextResponse.json({
    username: params.username,
    level: playerState.level,
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
    posX: playerState.posX,
    posY: playerState.posY,
    isNight: world.isNight,
    weather: world.weather,
    activeAction: activeAction ? { type: activeAction.type } : null,
  });
}
