"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useDict, useLocale } from "@/lib/i18n/LocaleProvider";
import { translateApiError } from "@/lib/i18n/errors";
import { apiFetch } from "@/lib/apiFetch";

export default function AccountForm({
  email,
  username,
  nextUsernameChangeAt,
}: {
  email: string;
  username: string;
  nextUsernameChangeAt: string | null;
}) {
  const dict = useDict();
  const locale = useLocale();
  const router = useRouter();
  const { update } = useSession();

  const [usernameInput, setUsernameInput] = useState(username);
  const [usernameBusy, setUsernameBusy] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSaved, setUsernameSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const onCooldown = nextUsernameChangeAt ? new Date(nextUsernameChangeAt).getTime() > Date.now() : false;

  async function handleUsernameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUsernameError(null);
    setUsernameSaved(false);
    setUsernameBusy(true);
    try {
      const res = await apiFetch("/api/account/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUsernameError(translateApiError(dict, data, locale));
        return;
      }
      setUsernameSaved(true);
      // Session sofort mit dem neuen Namen aktualisieren, ohne Neu-Login.
      await update();
      router.refresh();
    } finally {
      setUsernameBusy(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);

    if (newPassword !== confirmPassword) {
      setPasswordError(dict.settings.passwordMismatchError);
      return;
    }

    setPasswordBusy(true);
    try {
      const res = await apiFetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPasswordError(translateApiError(dict, data, locale));
        return;
      }
      setPasswordSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setPasswordBusy(false);
    }
  }

  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <span>👤</span>
          <span>{dict.settings.accountTitle}</span>
        </div>

        <div className="mb-4">
          <label className="field-label">{dict.settings.emailLabel}</label>
          <p className="input-field cursor-default select-text opacity-70">{email}</p>
          <p className="mt-1.5 text-xs text-stone-500">{dict.settings.emailNote}</p>
        </div>

        <form onSubmit={handleUsernameSubmit} className="space-y-3">
          <div>
            <label htmlFor="username" className="field-label">
              {dict.settings.usernameLabel}
            </label>
            <input
              id="username"
              className="input-field"
              value={usernameInput}
              onChange={(e) => {
                setUsernameInput(e.target.value);
                setUsernameSaved(false);
              }}
              minLength={3}
              disabled={onCooldown}
              required
            />
            {onCooldown && nextUsernameChangeAt && (
              <p className="mt-1.5 text-xs text-stone-500">
                {dict.settings.usernameCooldownNote(
                  new Date(nextUsernameChangeAt).toLocaleDateString(locale)
                )}
              </p>
            )}
          </div>

          {usernameError && <p className="text-sm text-terracotta-400">{usernameError}</p>}
          {usernameSaved && <p className="text-sm text-turquoise-300">{dict.settings.usernameSavedMessage}</p>}

          <button
            type="submit"
            className="btn-secondary"
            disabled={usernameBusy || onCooldown || usernameInput.trim() === username}
          >
            {dict.settings.usernameSaveButton}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <span>🔒</span>
          <span>{dict.settings.passwordTitle}</span>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <div>
            <label htmlFor="currentPassword" className="field-label">
              {dict.settings.currentPasswordLabel}
            </label>
            <input
              id="currentPassword"
              type="password"
              className="input-field"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="field-label">
              {dict.settings.newPasswordLabel}
            </label>
            <input
              id="newPassword"
              type="password"
              className="input-field"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="field-label">
              {dict.settings.confirmPasswordLabel}
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="input-field"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {passwordError && <p className="text-sm text-terracotta-400">{passwordError}</p>}
          {passwordSaved && <p className="text-sm text-turquoise-300">{dict.settings.passwordSavedMessage}</p>}

          <button type="submit" className="btn-secondary" disabled={passwordBusy}>
            {dict.settings.changePasswordButton}
          </button>
        </form>
      </section>
    </>
  );
}
