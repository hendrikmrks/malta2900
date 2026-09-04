"use client";

import { useState } from "react";
import { useDict } from "@/lib/i18n/LocaleProvider";
import { StoryArt } from "./StoryArt";
import { apiFetch } from "@/lib/apiFetch";
import { useToast } from "@/components/Toast";

type Phase = "story" | "tutorial-intro" | "tutorial";

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const dict = useDict();
  const toast = useToast();
  const [phase, setPhase] = useState<Phase>("story");
  const [storyIndex, setStoryIndex] = useState(0);
  const [tutorialIndex, setTutorialIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);

  // Wichtig: erst schliessen, NACHDEM der Server das Abschliessen bestaetigt
  // hat - sonst (frueherer Bug) konnte das Modal beim naechsten Besuch der
  // Insel wieder auftauchen, wenn der Abschluss-Request z.B. durch einen
  // schnellen Seitenwechsel nie ankam.
  async function finish() {
    setFinishing(true);
    try {
      const res = await apiFetch("/api/onboarding/complete", { method: "POST" });
      if (!res.ok) {
        toast.push("error", dict.errors.GENERIC);
        return;
      }
      onComplete();
    } catch {
      toast.push("error", dict.errors.GENERIC);
    } finally {
      setFinishing(false);
    }
  }

  if (phase === "story") {
    const slide = dict.onboarding.story[storyIndex];
    const isLast = storyIndex === dict.onboarding.story.length - 1;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-malta-950/95 p-4 backdrop-blur-md">
        <div className="w-full max-w-lg animate-fade-in-up overflow-hidden rounded-2xl border border-white/10 bg-malta-800/80 shadow-2xl">
          <div className="relative h-56 overflow-hidden sm:h-64" key={storyIndex}>
            <StoryArt index={storyIndex} />
            <div className="absolute inset-0 bg-gradient-to-t from-malta-800 via-transparent to-transparent" />
          </div>

          <div className="p-6 sm:p-8">
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-turquoise-400">
              {dict.onboarding.stepCounter(storyIndex + 1, dict.onboarding.story.length)}
            </p>
            <h2 className="mb-3 font-display text-xl font-bold text-sand-300 sm:text-2xl">
              {slide.title}
            </h2>
            <p className="text-sm leading-relaxed text-stone-300 sm:text-base">{slide.text}</p>

            <div className="mt-7 flex items-center justify-between gap-3">
              <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={finish} disabled={finishing}>
                {dict.onboarding.skip}
              </button>
              <div className="flex items-center gap-2">
                {storyIndex > 0 && (
                  <button
                    className="btn-secondary"
                    onClick={() => setStoryIndex((i) => Math.max(0, i - 1))}
                  >
                    {dict.onboarding.back}
                  </button>
                )}
                <button
                  className="btn-primary"
                  onClick={() => {
                    if (isLast) {
                      setPhase("tutorial-intro");
                    } else {
                      setStoryIndex((i) => i + 1);
                    }
                  }}
                >
                  {isLast ? dict.onboarding.start : dict.onboarding.next}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "tutorial-intro") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-malta-950/95 p-4 backdrop-blur-md">
        <div className="w-full max-w-md animate-fade-in-up rounded-2xl border border-white/10 bg-malta-800/80 p-7 text-center shadow-2xl sm:p-8">
          <div className="mb-4 text-4xl">🧭</div>
          <h2 className="mb-3 font-display text-xl font-bold text-sand-300">
            {dict.onboarding.tutorialIntro.title}
          </h2>
          <p className="mb-7 text-sm leading-relaxed text-stone-300">
            {dict.onboarding.tutorialIntro.text}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button className="btn-ghost" onClick={finish} disabled={finishing}>
              {dict.onboarding.skip}
            </button>
            <button className="btn-primary" onClick={() => setPhase("tutorial")}>
              {dict.onboarding.start}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tutorial-Toasts: nicht-modal, Dashboard bleibt sichtbar dahinter.
  const step = dict.onboarding.tutorial[tutorialIndex];
  const isLastStep = tutorialIndex === dict.onboarding.tutorial.length - 1;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 sm:justify-end sm:p-6">
      <div className="glass-card pointer-events-auto w-full max-w-sm animate-fade-in-up border-turquoise-400/30 bg-malta-800/95 p-5 shadow-2xl">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-turquoise-400">
            {dict.onboarding.stepCounter(tutorialIndex + 1, dict.onboarding.tutorial.length)}
          </span>
          <button
            className="text-xs text-stone-500 hover:text-stone-300 disabled:opacity-40"
            onClick={finish}
            disabled={finishing}
          >
            {dict.onboarding.skip}
          </button>
        </div>
        <h3 className="mb-1.5 text-base font-bold text-sand-300">{step.title}</h3>
        <p className="mb-4 text-sm leading-relaxed text-stone-300">{step.text}</p>
        <div className="flex items-center justify-end gap-2">
          {tutorialIndex > 0 && (
            <button
              className="btn-ghost !px-3 !py-1.5 text-xs"
              onClick={() => setTutorialIndex((i) => Math.max(0, i - 1))}
            >
              {dict.onboarding.back}
            </button>
          )}
          <button
            className="btn-primary !px-3 !py-1.5 text-xs"
            disabled={isLastStep && finishing}
            onClick={() => {
              if (isLastStep) {
                finish();
              } else {
                setTutorialIndex((i) => i + 1);
              }
            }}
          >
            {isLastStep ? dict.onboarding.finish : dict.onboarding.next}
          </button>
        </div>
      </div>
    </div>
  );
}
