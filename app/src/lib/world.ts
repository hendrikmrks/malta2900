import { prisma } from "@/lib/prisma";

export const WORLD_ID = "world";

export type WorldStateView = {
  isNight: boolean;
  weather: string;
  // Haendler-Preisfaktoren der "Bank" (siehe lib/game.ts) - 1 bis der Worker
  // sie beim ersten Tick berechnet hat.
  currencySellMultiplier: number;
  currencyBuyMultiplier: number;
};

/**
 * Liest den globalen Weltzustand. Faellt auf sinnvolle Standardwerte zurueck,
 * falls der Worker die Zeile noch nicht angelegt hat (z.B. direkt nach dem
 * allerersten Start des Stacks).
 */
export async function getWorldState(): Promise<WorldStateView> {
  const world = await prisma.worldState.findUnique({ where: { id: WORLD_ID } });
  return {
    isNight: world?.isNight ?? false,
    weather: world?.weather ?? "sunny",
    currencySellMultiplier: world?.currencySellMultiplier ?? 1,
    currencyBuyMultiplier: world?.currencyBuyMultiplier ?? 1,
  };
}
