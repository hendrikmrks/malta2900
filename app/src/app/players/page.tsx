import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TopHeader } from "@/components/TopHeader";
import { getServerDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const session = await getServerSession(authOptions);
  const userId = await getSessionUserId();

  if (!userId || !session?.user) {
    redirect("/login");
  }

  const players = await prisma.playerState.findMany({
    where: { userId: { not: userId } },
    include: { user: { select: { username: true } } },
    orderBy: { level: "desc" },
  });

  const { dict } = await getServerDictionary();

  return (
    <main className="mx-auto max-w-[1600px] px-4 pb-16 pt-8 sm:px-6 lg:px-10">
      <TopHeader username={session.user.name ?? ""} active="/players" />

      <p className="glass-card mb-6 border-l-4 !border-l-turquoise-500 px-5 py-4 text-sm leading-relaxed text-stone-300">
        {dict.players.introBefore}
        <Link href="/market" className="text-turquoise-400 hover:text-turquoise-300">
          {dict.players.marketLink}
        </Link>
        {dict.players.introAfter}
      </p>

      {players.length === 0 ? (
        <div className="panel text-sm text-stone-400">{dict.players.empty}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((p, i) => (
            <div key={p.id} className="panel" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display text-base font-bold text-sand-300">
                  {p.user.username}
                </span>
                <span className="badge-on">
                  🎖️ {dict.players.levelAbbrev} {p.level}
                </span>
              </div>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="badge-on">
                  {dict.players.shelterBadge} Lv.{p.shelterLevel}
                </span>
                <span className={p.hasFireplace ? "badge-on" : "badge-off"}>
                  {dict.players.fireplaceBadge}
                </span>
                <span className={p.hasWell ? "badge-on" : "badge-off"}>
                  {dict.players.wellBadge}
                </span>
                <span className={p.hasGarden ? "badge-on" : "badge-off"}>
                  {dict.players.gardenBadge}
                </span>
                <span className={p.hasStorehouse ? "badge-on" : "badge-off"}>
                  {dict.players.storehouseBadge}
                </span>
              </div>
              <Link href={`/players/${p.user.username}`} className="btn-primary w-full">
                {dict.players.visitButton}
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
