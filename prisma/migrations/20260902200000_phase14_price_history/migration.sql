-- Phase 14: Preisverlauf der Bank fuer die Wirtschafts-Uebersichtsseite.
ALTER TABLE "WorldState" ADD COLUMN "lastPriceSnapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "PriceSnapshot" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sellMultiplier" DOUBLE PRECISION NOT NULL,
    "buyMultiplier" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PriceSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PriceSnapshot_createdAt_idx" ON "PriceSnapshot"("createdAt");

-- Ein erster Datenpunkt, damit der Graph nicht komplett leer startet.
INSERT INTO "PriceSnapshot" ("id", "sellMultiplier", "buyMultiplier")
SELECT 'seed-phase14-initial', "currencySellMultiplier", "currencyBuyMultiplier"
FROM "WorldState" WHERE id = 'world';
