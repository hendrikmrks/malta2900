import { de } from "./dictionaries/de";
import { en } from "./dictionaries/en";
import { ptBR } from "./dictionaries/pt-BR";
import type { Dictionary } from "./dictionary-type";
import type { Locale } from "./locales";

export const dictionaries: Record<Locale, Dictionary> = {
  de,
  en,
  "pt-BR": ptBR,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary } from "./dictionary-type";
export * from "./locales";
