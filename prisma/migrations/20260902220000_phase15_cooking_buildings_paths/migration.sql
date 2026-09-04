-- Phase 15: Kochen am Lagerfeuer, zwei weitere Dorf-Gebaeude (Garten,
-- Vorratshaus) und frei platzierbare Weg-/Strassenkacheln.
ALTER TABLE "PlayerState" ADD COLUMN "hasGarden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PlayerState" ADD COLUMN "gardenX" INTEGER;
ALTER TABLE "PlayerState" ADD COLUMN "gardenY" INTEGER;
ALTER TABLE "PlayerState" ADD COLUMN "gardenVegAccum" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "PlayerState" ADD COLUMN "hasStorehouse" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PlayerState" ADD COLUMN "storehouseX" INTEGER;
ALTER TABLE "PlayerState" ADD COLUMN "storehouseY" INTEGER;

CREATE TABLE "PathTile" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PathTile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PathTile_playerId_idx" ON "PathTile"("playerId");
CREATE UNIQUE INDEX "PathTile_playerId_x_y_key" ON "PathTile"("playerId", "x", "y");

ALTER TABLE "PathTile" ADD CONSTRAINT "PathTile_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "PlayerState"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
