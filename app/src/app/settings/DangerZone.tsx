"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useDict, useLocale } from "@/lib/i18n/LocaleProvider";
import { translateApiError } from "@/lib/i18n/errors";
import { apiFetch } from "@/lib/apiFetch";

// Eigene, volle-Breite Komponente statt Teil von AccountForm - haelt die
// Einstellungsseiten-Spalten ausgeglichen (Account+Passwort links,
// Sprache+Tutorial rechts, je zwei Panels) und trennt die destruktive Aktion
// optisch klar von den routinemaessigen Einstellungen.
export default function DangerZone() {
  const dict = useDict();
  const locale = useLocale();

  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDeleteAccount() {
    setError(null);
    setBusy(true);
    try {
      const res = await apiFetch("/api/account/delete", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(translateApiError(dict, data, locale));
        return;
      }
      // Session war JWT-basiert und weiss nichts vom geloeschten Account -
      // signOut raeumt Cookie/Client-State auf und leitet weiter, statt eine
      // Ghost-Session mit einem nicht mehr existierenden Spielstand zu lassen.
      await signOut({ callbackUrl: "/" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="panel !border-terracotta-500/30">
        <div className="panel-header !text-terracotta-400">
          <span>⚠️</span>
          <span>{dict.settings.dangerZoneTitle}</span>
        </div>
        <p className="mb-4 text-sm text-stone-400">{dict.settings.deleteAccountWarning}</p>
        <button
          className="btn-secondary !border-terracotta-500/40 !text-terracotta-300 hover:!bg-terracotta-500/10"
          onClick={() => setShowConfirm(true)}
        >
          {dict.settings.deleteAccountButton}
        </button>
      </section>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-malta-950/95 p-4 backdrop-blur-md">
          <div className="w-full max-w-md animate-fade-in-up rounded-2xl border border-terracotta-500/30 bg-malta-800/90 p-6 shadow-2xl sm:p-7">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="text-2xl">⚠️</span>
              <h2 className="font-display text-lg font-bold text-terracotta-300">
                {dict.settings.dangerZoneTitle}
              </h2>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-stone-300">
              {dict.settings.deleteAccountWarning}
            </p>
            {error && <p className="mb-4 text-sm text-terracotta-400">{error}</p>}
            <div className="flex items-center justify-end gap-3">
              <button className="btn-ghost" disabled={busy} onClick={() => setShowConfirm(false)}>
                {dict.common.cancel}
              </button>
              <button
                className="btn-primary !from-terracotta-600 !to-terracotta-700"
                disabled={busy}
                onClick={handleDeleteAccount}
              >
                {busy ? "…" : dict.settings.deleteAccountConfirmButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
