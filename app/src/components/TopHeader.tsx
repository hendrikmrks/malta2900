import Link from "next/link";
import SignOutButton from "@/app/dashboard/SignOutButton";
import { getServerDictionary } from "@/lib/i18n/server";

export async function TopHeader({
  username,
  active,
  compact = false,
}: {
  username: string;
  active: string;
  compact?: boolean;
}) {
  const { dict } = await getServerDictionary();

  const navItems = [
    { href: "/dashboard", label: dict.nav.island, icon: "🏝️" },
    { href: "/players", label: dict.nav.neighbors, icon: "🧭" },
    { href: "/market", label: dict.nav.market, icon: "🛒" },
    { href: "/economy", label: dict.nav.economy, icon: "📊" },
    { href: "/settings", label: dict.nav.settings, icon: "⚙️" },
  ];

  return (
    <header className={`flex flex-wrap items-center justify-between gap-4 ${compact ? "mb-2" : "mb-6"}`}>
      <div className="flex items-center gap-3">
        <div
          className={`flex animate-float-sm items-center justify-center rounded-xl border border-white/10 bg-gradient-to-b from-terracotta-500/25 to-turquoise-500/10 shadow-glow ${
            compact ? "h-8 w-8 text-base" : "h-11 w-11 text-xl"
          }`}
        >
          🏝️
        </div>
        <div>
          <h1
            className={`font-display font-bold tracking-wide text-sand-300 ${
              compact ? "text-base" : "text-xl sm:text-2xl"
            }`}
          >
            Malta2900
          </h1>
          {!compact && (
            <p className="text-xs uppercase tracking-[0.2em] text-turquoise-400">
              {dict.nav.yearBadge}
            </p>
          )}
        </div>
      </div>

      <nav className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-label={item.label}
            className={`rounded-lg px-2.5 py-1.5 text-sm font-medium transition sm:px-3 ${
              active === item.href
                ? "bg-turquoise-500/20 text-turquoise-300"
                : "text-stone-400 hover:text-stone-100"
            }`}
          >
            <span aria-hidden>{item.icon}</span>{" "}
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-stone-400 sm:inline">
          {dict.nav.loggedInAs(username)}
        </span>
        <SignOutButton label={dict.nav.signOut} />
      </div>
    </header>
  );
}
