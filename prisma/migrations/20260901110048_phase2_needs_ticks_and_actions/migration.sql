-- AlterTable
ALTER TABLE "PlayerState" ADD COLUMN     "figCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastTickAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "hunger" SET DEFAULT 100,
ALTER COLUMN "hunger" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "thirst" SET DEFAULT 100,
ALTER COLUMN "thirst" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "energy" SET DEFAULT 100,
ALTER COLUMN "energy" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "PendingAction" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readyAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PendingAction_playerId_idx" ON "PendingAction"("playerId");

-- CreateIndex
CREATE INDEX "PendingAction_readyAt_idx" ON "PendingAction"("readyAt");

-- AddForeignKey
ALTER TABLE "PendingAction" ADD CONSTRAINT "PendingAction_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "PlayerState"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
