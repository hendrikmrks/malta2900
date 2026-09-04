-- Phase 11: Basis-Huette fuer jeden Spieler + ausbaubare Huette + Brunnen.
ALTER TABLE "PlayerState" ADD COLUMN "shelterLevel" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "PlayerState" ADD COLUMN "hasWell" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PlayerState" ADD COLUMN "wellX" INTEGER;
ALTER TABLE "PlayerState" ADD COLUMN "wellY" INTEGER;
ALTER TABLE "PlayerState" ADD COLUMN "wellWaterAccum" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Bestehende Accounts erhalten die garantierte Basis-Huette rueckwirkend, statt
-- nur neu registrierte - siehe api/register fuer die Vergabe an neue Accounts.
UPDATE "PlayerState"
SET "hasShelter" = true,
    "shelterX" = COALESCE("shelterX", 62),
    "shelterY" = COALESCE("shelterY", 78)
WHERE "hasShelter" = false;
