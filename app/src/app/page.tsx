import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServerDictionary } from "@/lib/i18n/server";
import { HeroArt } from "@/components/landing/HeroArt";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/dashboard");
  }

  const { dict } = await getServerDictionary();

  return (
    <main className="mx-auto max-w-[1200px] px-4 pb-20 pt-6 sm:px-6 lg:px-10">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 animate-float-sm items-center justify-center rounded-xl border border-white/10 bg-gradient-to-b from-terracotta-500/25 to-turquoise-500/10 text-lg shadow-glow">
            🏝️
          </div>
          <span className="font-display text-lg font-bold tracking-wide text-sand-300">
            {dict.landing.title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link href="/login" className="btn-ghost !px-3 !py-1.5 text-sm">
            {dict.auth.login.title}
          </Link>
        </div>
      </header>

      {/* Hero -------------------------------------------------- */}
      <section className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="animate-fade-in-up">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-turquoise-400">
            {dict.landing.heroKicker}
          </p>
          <h1 className="mb-5 font-display text-3xl font-bold leading-tight text-sand-300 sm:text-4xl lg:text-5xl">
            {dict.landing.heroTitle}
          </h1>
          <p className="mb-8 max-w-xl text-base leading-relaxed text-stone-300">
            {dict.landing.heroSubtitle}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register" className="btn-primary">
              {dict.landing.ctaRegister}
            </Link>
            <Link href="/login" className="btn-secondary">
              {dict.landing.ctaLogin}
            </Link>
          </div>
        </div>

        <div
          className="glass-card animate-fade-in-up relative aspect-[3/2] overflow-hidden shadow-glow-terracotta"
          style={{ animationDelay: "120ms" }}
        >
          <HeroArt />
          <p className="absolute bottom-3 left-0 right-0 text-center text-xs uppercase tracking-wide text-stone-300/80">
            {dict.landing.screenshotCaption}
          </p>
        </div>
      </section>

      {/* Features -------------------------------------------------- */}
      <section className="mt-20">
        <h2 className="mb-8 text-center font-display text-2xl font-bold text-sand-300">
          {dict.landing.featuresTitle}
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dict.landing.features.map((f, i) => (
            <div
              key={f.title}
              className="panel animate-fade-in-up"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="mb-3 text-3xl">{f.icon}</div>
              <h3 className="mb-1.5 font-semibold text-sand-300">{f.title}</h3>
              <p className="text-sm leading-relaxed text-stone-400">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA -------------------------------------------------- */}
      <section className="mt-20 text-center">
        <Link href="/register" className="btn-primary">
          {dict.landing.ctaRegister}
        </Link>
        <p className="mt-6 text-xs text-stone-600">{dict.landing.footerNote}</p>
      </section>
    </main>
  );
}
