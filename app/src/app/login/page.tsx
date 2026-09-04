"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useDict } from "@/lib/i18n/LocaleProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function LoginPage() {
  const dict = useDict();
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (res?.error) {
      setError(dict.auth.login.wrongCredentials);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 animate-float-sm items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-b from-terracotta-500/25 to-turquoise-500/10 text-2xl shadow-glow">
            🏝️
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-turquoise-400">
            {dict.nav.yearBadge} · Malta
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-wide text-sand-300">
            {dict.landing.title}
          </h1>
        </div>

        <div className="glass-card p-7 sm:p-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-stone-100">{dict.auth.login.title}</h2>
              <p className="text-sm text-stone-400">{dict.auth.login.subtitle}</p>
            </div>
            <LanguageSwitcher />
          </div>

          {justRegistered && (
            <p className="mb-5 rounded-xl border border-turquoise-400/20 bg-turquoise-500/10 px-3.5 py-2.5 text-sm text-turquoise-300">
              {dict.auth.login.accountCreated}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="field-label">
                {dict.auth.login.email}
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
                {dict.auth.login.password}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-terracotta-400">{error}</p>}

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? dict.auth.login.submitting : dict.auth.login.submit}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-400">
            {dict.auth.login.noAccount}{" "}
            <Link href="/register" className="font-medium text-turquoise-400 hover:text-turquoise-300">
              {dict.auth.login.registerLink}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
