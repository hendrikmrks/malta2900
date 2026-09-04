-- AlterTable
ALTER TABLE "PlayerState" ADD COLUMN     "onboardingDone" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'de';
