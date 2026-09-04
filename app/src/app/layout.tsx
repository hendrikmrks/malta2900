import type { Metadata, Viewport } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";
import { getLocale, getServerDictionary } from "@/lib/i18n/server";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import { ToastProvider } from "@/components/Toast";

const display = Cinzel({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Async statt statischem `metadata`-Export, damit die Beschreibung (Browser-Tab/
// Suchmaschinen-Snippet) in der jeweils aktuellen Sprache des Nutzers steht,
// statt immer fest auf Deutsch zu stehen.
export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getServerDictionary();
  return {
    title: {
      default: "Malta2900",
      template: "%s · Malta2900",
    },
    description: dict.landing.metaDescription,
  };
}

// themeColor gehoert seit Next.js 14 in einen eigenen viewport-Export statt
// in metadata - sonst gibt es bei jedem Request eine Konsolen-Warnung.
export const viewport: Viewport = {
  themeColor: "#0a1315",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${display.variable} ${sans.variable}`}>
      <body className="relative min-h-screen overflow-x-hidden bg-malta-950 font-sans text-stone-100">
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-24 -top-32 h-96 w-96 animate-float-slow rounded-full bg-terracotta-500/20 blur-[120px]" />
          <div className="absolute -right-32 top-1/3 h-[28rem] w-[28rem] animate-float rounded-full bg-turquoise-500/15 blur-[140px] [animation-delay:1.5s]" />
          <div className="absolute bottom-0 left-1/4 h-80 w-80 animate-float-slow rounded-full bg-sand-500/10 blur-[120px] [animation-delay:3s]" />
          <div className="absolute inset-0 bg-grid-fade opacity-60" />
        </div>
        <AuthSessionProvider>
          <LocaleProvider locale={locale}>
            <ToastProvider>{children}</ToastProvider>
          </LocaleProvider>
        </AuthSessionProvider>

        {/* Fixed statt im normalen Fluss - nimmt keinen Platz weg, damit z.B.
            das Dashboard weiterhin ohne Scrollen in die volle Viewport-Hoehe
            passt. Eigener (halb-opaker) Pillen-Hintergrund statt nur Text,
            damit er auf JEDER Seite lesbar bleibt, auch vor bunten Flaechen
            wie der Insel-Karte - ein sehr hoher z-index sorgt zusaetzlich
            dafuer, dass ihn nichts anderes ueberdeckt. safe-area-inset schuetzt
            vor der Home-Indicator-Leiste auf iOS. */}
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center px-4"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        >
          <span className="rounded-full border border-white/10 bg-malta-950/85 px-3 py-1 text-[10px] text-stone-300 shadow-lg shadow-black/40 backdrop-blur-sm">
            Made with <span className="text-terracotta-400">❤</span> for Larissa
          </span>
        </div>
      </body>
    </html>
  );
}
