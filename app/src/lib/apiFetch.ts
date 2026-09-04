"use client";

/**
 * Wrapper um `fetch` fuer alle authentifizierten API-Aufrufe: leitet bei
 * abgelaufener/fehlender Session (401) automatisch zum Login weiter, statt
 * dass die Seite mit einer stumpfen "Nicht eingeloggt"-Fehlermeldung haengen
 * bleibt.
 */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
  }
  return res;
}
