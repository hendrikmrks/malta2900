-- Phase 10: Ressourcen-Gebiete statt fester Sammel-Punkte + neue Rohstoffe.
ALTER TABLE "PlayerState" ADD COLUMN "fishCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PlayerState" ADD COLUMN "stoneCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "MapRegion" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "radius" INTEGER NOT NULL DEFAULT 18,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MapRegion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MapRegion_playerId_idx" ON "MapRegion"("playerId");
CREATE UNIQUE INDEX "MapRegion_playerId_type_key" ON "MapRegion"("playerId", "type");

ALTER TABLE "MapRegion" ADD CONSTRAINT "MapRegion_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "PlayerState"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
