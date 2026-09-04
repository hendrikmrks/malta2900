import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getWorldState } from "@/lib/world";
import type { RegionType } from "@/lib/game";
import { TopHeader } from "@/components/TopHeader";
import { getServerDictionary } from "@/lib/i18n/server";
import VisitIsland from "./VisitIsland";

export const dynamic = "force-dynamic";

export default async function VisitPlayerPage({
  params,
}: {
  params: { username: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = await getSessionUserId();

  if (!userId || !session?.user) {
    redirect("/login");
  }

  if (params.username === session.user.name) {
    redirect("/dashboard");
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
    notFound();
  }

  const activeAction = playerState.pendingActions[0] ?? null;
  const world = await getWorldState();
  const { dict } = await getServerDictionary();

  return (
    <main className="mx-auto max-w-[1600px] px-4 pb-16 pt-8 sm:px-6 lg:px-10">
      <TopHeader username={session.user.name ?? ""} active="/players" />

      <div className="mb-6">
        <Link href="/players" className="btn-ghost">
          {dict.players.backLink}
        </Link>
      </div>

      <VisitIsland
        username={params.username}
        initialState={{
          level: playerState.level,
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
          isNight: world.isNight,
          weather: world.weather,
          posX: playerState.posX,
          posY: playerState.posY,
          activeType: activeAction?.type ?? null,
        }}
      />
    </main>
  );
}
