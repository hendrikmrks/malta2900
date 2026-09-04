-- Phase 12: Waehrung (Muenzen) + Haendler-Kaufoption auf dem Marktplatz.
ALTER TABLE "PlayerState" ADD COLUMN "coinCount" INTEGER NOT NULL DEFAULT 0;

-- Bestehende Accounts bekommen denselben Startbestand wie neu registrierte
-- (siehe api/register) - sonst waeren sie ggue. neuen Spielern benachteiligt.
UPDATE "PlayerState" SET "coinCount" = 20 WHERE "coinCount" = 0;
