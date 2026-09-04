-- AlterTable
ALTER TABLE "PlayerState" ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "xp" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "WorldState" (
    "id" TEXT NOT NULL,
    "cyclePositionMs" INTEGER NOT NULL DEFAULT 0,
    "isNight" BOOLEAN NOT NULL DEFAULT false,
    "weather" TEXT NOT NULL DEFAULT 'sunny',
    "nextWeatherRollAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastTickAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorldState_pkey" PRIMARY KEY ("id")
);
