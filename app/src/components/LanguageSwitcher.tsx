"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { LOCALES, LOCALE_LABELS, LOCALE_FLAGS, LOCALE_COOKIE, type Locale } from "@/lib/i18n/locales";

/** Sprachumschalter fuer oeffentliche Seiten (Landing/Login/Register) - setzt
 * ein Cookie, das der Server beim naechsten Render liest (kein Account noetig). */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();

  function setLocale(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div className={`flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 ${className}`}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
            l === locale
              ? "bg-turquoise-500/20 text-turquoise-300"
              : "text-stone-400 hover:text-stone-100"
          }`}
          title={LOCALE_LABELS[l]}
        >
          {LOCALE_FLAGS[l]}
        </button>
      ))}
    </div>
  );
}
