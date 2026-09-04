"use client";

import { createContext, useContext } from "react";
import { getDictionary } from "./index";
import type { Dictionary } from "./dictionary-type";
import type { Locale } from "./locales";

const LocaleContext = createContext<{ locale: Locale; dict: Dictionary } | null>(null);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={{ locale, dict: getDictionary(locale) }}>
      {children}
    </LocaleContext.Provider>
  );
}

function useLocaleContext() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useDict/useLocale muss innerhalb von <LocaleProvider> verwendet werden.");
  }
  return ctx;
}

export function useDict(): Dictionary {
  return useLocaleContext().dict;
}

export function useLocale(): Locale {
  return useLocaleContext().locale;
}
