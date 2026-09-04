"use client";

import { useEffect, useRef, useState } from "react";

export type Gain = { amount: number; key: number } | null;

/** Meldet ~900ms lang den Zuwachs, nachdem `value` gegenueber dem letzten Wert gestiegen ist. */
export function useGainFeedback(value: number): Gain {
  const prev = useRef(value);
  const [gain, setGain] = useState<Gain>(null);

  useEffect(() => {
    if (value > prev.current) {
      const amount = value - prev.current;
      setGain({ amount, key: Date.now() });
      const timeout = setTimeout(() => setGain(null), 900);
      prev.current = value;
      return () => clearTimeout(timeout);
    }
    prev.current = value;
  }, [value]);

  return gain;
}

/** Meldet ~1.6s lang einen Level-Aufstieg, nachdem `level` gestiegen ist. */
export function useLevelUpFeedback(level: number): boolean {
  const prev = useRef(level);
  const [leveledUp, setLeveledUp] = useState(false);

  useEffect(() => {
    if (level > prev.current) {
      setLeveledUp(true);
      const timeout = setTimeout(() => setLeveledUp(false), 1600);
      prev.current = level;
      return () => clearTimeout(timeout);
    }
    prev.current = level;
  }, [level]);

  return leveledUp;
}

/** true fuer kurze Zeit, nachdem ein Boolean von false auf true gewechselt ist (z.B. frisch gebaut). */
export function useJustBecameTrue(value: boolean): boolean {
  const prev = useRef(value);
  const [justTrue, setJustTrue] = useState(false);

  useEffect(() => {
    if (value && !prev.current) {
      setJustTrue(true);
      const timeout = setTimeout(() => setJustTrue(false), 700);
      prev.current = value;
      return () => clearTimeout(timeout);
    }
    prev.current = value;
  }, [value]);

  return justTrue;
}

/**
 * Erkennt Positionswechsel: liefert "walking" + Blickrichtung fuers
 * Character-Sprite, fuer die Dauer von `durationMs` (sollte zur tatsaechlich
 * verwendeten CSS-Transition-Dauer der Bewegung passen).
 */
export function useWalkingFlag(x: number, durationMs = 650) {
  const prevX = useRef(x);
  const [walking, setWalking] = useState(false);
  const [flip, setFlip] = useState(false);

  useEffect(() => {
    if (x !== prevX.current) {
      setFlip(x < prevX.current);
      setWalking(true);
      const timeout = setTimeout(() => setWalking(false), durationMs);
      prevX.current = x;
      return () => clearTimeout(timeout);
    }
    prevX.current = x;
  }, [x, durationMs]);

  return { walking, flip };
}
