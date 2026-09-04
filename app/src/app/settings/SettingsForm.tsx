"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDict } from "@/lib/i18n/LocaleProvider";
import { LOCALES, LOCALE_LABELS, LOCALE_COOKIE, type Locale } from "@/lib/i18n/locales";
import { apiFetch } from "@/lib/apiFetch";

export default function SettingsForm({ currentLocale }: { currentLocale: string }) {
  const dict = useDict();
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>(
    LOCALES.includes(currentLocale as Locale) ? (currentLocale as Locale) : "de"
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [replaying, setReplaying] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await apiFetch("/api/settings/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      // Cookie zusaetzlich setzen, damit ein evtl. spaeteres Ausloggen die
      // zuletzt gewaehlte Sprache auf den oeffentlichen Seiten beibehaelt.
      document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleReplay() {
    setReplaying(true);
    try {
      await apiFetch("/api/onboarding/replay", { method: "POST" });
      router.push("/dashboard");
    } finally {
      setReplaying(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="panel">
        <div className="panel-header">
          <span>⚙️</span>
          <span>{dict.settings.title}</span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="locale" className="field-label">
              {dict.settings.languageLabel}
            </label>
            <select
              id="locale"
              className="input-field"
              value={locale}
              onChange={(e) => {
                setLocale(e.target.value as Locale);
                setSaved(false);
              }}
            >
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_LABELS[l]}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-stone-500">{dict.settings.languageHint}</p>
          </div>

          {saved && <p className="text-sm text-turquoise-300">{dict.settings.savedMessage}</p>}

          <button type="submit" className="btn-primary" disabled={saving}>
            {dict.settings.saveButton}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <span>🧭</span>
          <span>{dict.settings.replayTutorial}</span>
        </div>
        <p className="mb-4 text-sm text-stone-400">{dict.settings.replayTutorialHint}</p>
        <button className="btn-secondary" onClick={handleReplay} disabled={replaying}>
          {dict.settings.replayTutorial}
        </button>
      </section>
    </div>
  );
}
