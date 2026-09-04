import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TopHeader } from "@/components/TopHeader";
import { getServerDictionary } from "@/lib/i18n/server";
import EconomyBoard from "./EconomyBoard";

export const dynamic = "force-dynamic";

export default async function EconomyPage() {
  const session = await getServerSession(authOptions);
  const userId = await getSessionUserId();

  if (!userId || !session?.user) {
    redirect("/login");
  }

  const snapshots = await prisma.priceSnapshot.findMany({
    orderBy: { createdAt: "asc" },
    select: { createdAt: true, sellMultiplier: true, buyMultiplier: true },
  });

  const { dict } = await getServerDictionary();

  return (
    <main className="mx-auto max-w-[1600px] px-4 pb-16 pt-8 sm:px-6 lg:px-10">
      <TopHeader username={session.user.name ?? ""} active="/economy" />

      <p className="glass-card mb-6 border-l-4 !border-l-turquoise-500 px-5 py-4 text-sm leading-relaxed text-stone-300">
        {dict.economy.intro}
      </p>

      <EconomyBoard
        initialSnapshots={snapshots.map((s) => ({
          at: s.createdAt.toISOString(),
          sellMultiplier: s.sellMultiplier,
          buyMultiplier: s.buyMultiplier,
        }))}
      />
    </main>
  );
}
