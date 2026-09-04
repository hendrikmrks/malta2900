import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWorldState } from "@/lib/world";
import { XP_PER_LEVEL, type RegionType } from "@/lib/game";
import { TopHeader } from "@/components/TopHeader";
import Dashboard from "./Dashboard";

// Nie aus dem Router-Cache bedienen - sonst zeigt die Seite nach einer
// Client-Navigation (z.B. vom Marktplatz zurueck) bis zu 30s lang noch den
// Stand von vor dem letzten Besuch, statt frisch aus der DB zu lesen.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = await getSessionUserId();

  if (!userId || !session?.user) {
    redirect("/login");
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
    redirect("/login");
  }

  const activeAction = playerState.pendingActions[0] ?? null;
  const world = await getWorldState();

  return (
    <main className="mx-auto flex max-w-[1800px] flex-col px-4 pb-3 pt-3 sm:px-6 lg:h-dvh lg:min-h-0 lg:overflow-hidden lg:px-8">
      <div className="shrink-0">
        <TopHeader username={session.user.name ?? ""} active="/dashboard" compact />
      </div>

      <Dashboard
        initialState={{
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
            type: r.type as RegionType,
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
          posX: playerState.posX,
          posY: playerState.posY,
          onboardingDone: playerState.onboardingDone,
          activeAction: activeAction
            ? {
                type: activeAction.type,
                startedAt: activeAction.startedAt.toISOString(),
                readyAt: activeAction.readyAt.toISOString(),
              }
            : null,
        }}
      />
    </main>
  );
}
