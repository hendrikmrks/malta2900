import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TopHeader } from "@/components/TopHeader";
import { getServerDictionary } from "@/lib/i18n/server";
import { getWorldState } from "@/lib/world";
import type { ResourceType } from "@/lib/game";
import MarketBoard from "./MarketBoard";

// Nie aus dem Router-Cache bedienen - sonst zeigt die Seite nach einer
// Client-Navigation bis zu 30s lang noch den Stand von vor dem letzten Besuch.
export const dynamic = "force-dynamic";

export default async function MarketPage() {
  const session = await getServerSession(authOptions);
  const userId = await getSessionUserId();

  if (!userId || !session?.user) {
    redirect("/login");
  }

  const playerState = await prisma.playerState.findUnique({ where: { userId } });
  if (!playerState) {
    redirect("/login");
  }

  const offers = await prisma.tradeOffer.findMany({
    where: { status: "open" },
    include: { seller: { include: { user: { select: { username: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  const { dict } = await getServerDictionary();
  const world = await getWorldState();

  return (
    <main className="mx-auto max-w-[1600px] px-4 pb-16 pt-8 sm:px-6 lg:px-10">
      <TopHeader username={session.user.name ?? ""} active="/market" />

      <p className="glass-card mb-6 border-l-4 !border-l-turquoise-500 px-5 py-4 text-sm leading-relaxed text-stone-300">
        {dict.market.intro}
      </p>

      <MarketBoard
        initialInventory={{
          fig: playerState.figCount,
          wood: playerState.woodCount,
          water: playerState.waterCount,
          vegetable: playerState.vegetableCount,
          fish: playerState.fishCount,
          stone: playerState.stoneCount,
          coin: playerState.coinCount,
        }}
        initialCurrency={{
          sellMultiplier: world.currencySellMultiplier,
          buyMultiplier: world.currencyBuyMultiplier,
        }}
        initialOffers={offers.map((o) => ({
          id: o.id,
          sellerUsername: o.seller.user.username,
          isOwn: o.sellerId === playerState.id,
          offerResource: o.offerResource as ResourceType,
          offerAmount: o.offerAmount,
          requestResource: o.requestResource as ResourceType,
          requestAmount: o.requestAmount,
        }))}
      />
    </main>
  );
}
