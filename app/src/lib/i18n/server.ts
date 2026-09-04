import { cache } from "react";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./locales";
import { getDictionary } from "./index";

/**
 * Ermittelt die aktuelle Sprache: eingeloggte Nutzer -> User.locale aus der DB,
 * sonst das Cookie, sonst Deutsch. `cache()` sorgt dafuer, dass mehrere Aufrufe
 * innerhalb derselben Anfrage (Layout + Seite) nur eine DB-Abfrage ausloesen.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    const userId = (session.user as { id?: string }).id;
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { locale: true } });
      if (user && isLocale(user.locale)) {
        return user.locale;
      }
    }
  }

  const cookieLocale = cookies().get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) {
    return cookieLocale;
  }

  return DEFAULT_LOCALE;
});

export async function getServerDictionary() {
  const locale = await getLocale();
  return { locale, dict: getDictionary(locale) };
}
