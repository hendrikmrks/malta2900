export const LOCALES = ["de", "en", "pt-BR"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "de";

export const LOCALE_COOKIE = "ml_locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
  "pt-BR": "Português (Brasil)",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  de: "🇩🇪",
  en: "🇬🇧",
  "pt-BR": "🇧🇷",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}
