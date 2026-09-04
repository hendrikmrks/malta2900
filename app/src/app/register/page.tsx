"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDict, useLocale } from "@/lib/i18n/LocaleProvider";
import { translateApiError } from "@/lib/i18n/errors";
import { LOCALES, LOCALE_LABELS, LOCALE_COOKIE, type Locale } from "@/lib/i18n/locales";

export default function RegisterPage() {
  const dict = useDict();
  const locale = useLocale();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleLocaleChange(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, locale }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(translateApiError(dict, data) || dict.auth.register.genericError);
      return;
    }

    router.push("/login?registered=1");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 animate-float-sm items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-b from-terracotta-500/25 to-turquoise-500/10 text-2xl shadow-glow">
            🌴
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-turquoise-400">
            {dict.nav.yearBadge} · Malta
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-wide text-sand-300">
            {dict.landing.title}
          </h1>
        </div>

        <div className="glass-card p-7 sm:p-8">
          <h2 className="mb-1 text-lg font-semibold text-stone-100">{dict.auth.register.title}</h2>
          <p className="mb-6 text-sm text-stone-400">{dict.auth.register.subtitle}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="field-label">
                {dict.auth.register.username}
              </label>
              <input
                id="username"
                name="username"
                type="text"
                className="input-field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
              />
            </div>
            <div>
              <label htmlFor="email" className="field-label">
                {dict.auth.register.email}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="field-label">
                {dict.auth.register.password}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <label htmlFor="locale" className="field-label">
                {dict.auth.register.language}
              </label>
              <select
                id="locale"
                className="input-field"
                value={locale}
                onChange={(e) => handleLocaleChange(e.target.value as Locale)}
              >
                {LOCALES.map((l) => (
                  <option key={l} value={l}>
                    {LOCALE_LABELS[l]}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm text-terracotta-400">{error}</p>}

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? dict.auth.register.submitting : dict.auth.register.submit}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-400">
            {dict.auth.register.haveAccount}{" "}
            <Link href="/login" className="font-medium text-turquoise-400 hover:text-turquoise-300">
              {dict.auth.register.loginLink}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
