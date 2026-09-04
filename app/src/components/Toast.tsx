"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastKind = "success" | "error";
type ToastItem = { id: number; kind: ToastKind; message: string };
type ToastContextValue = { push: (kind: ToastKind, message: string) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = ++idRef.current;
    setItems((cur) => [...cur, { id, kind, message }]);
    setTimeout(() => {
      setItems((cur) => cur.filter((t) => t.id !== id));
    }, AUTO_DISMISS_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-5 sm:items-end">
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto max-w-sm animate-fade-in-up rounded-xl border px-4 py-2.5 text-sm shadow-2xl backdrop-blur-xl ${
              t.kind === "error"
                ? "border-terracotta-500/40 bg-malta-900/95 text-terracotta-300"
                : "border-turquoise-400/40 bg-malta-900/95 text-turquoise-300"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast muss innerhalb von <ToastProvider> verwendet werden.");
  }
  return ctx;
}
