-- Phase 13: Dynamische Haendler-Preise ("Bank" steuert Inflation/Deflation).
ALTER TABLE "WorldState" ADD COLUMN "currencySellMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1;
ALTER TABLE "WorldState" ADD COLUMN "currencyBuyMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1;
