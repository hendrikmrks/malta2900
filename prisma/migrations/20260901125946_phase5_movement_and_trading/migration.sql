-- AlterTable
ALTER TABLE "PlayerState" ADD COLUMN     "posX" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "posY" INTEGER NOT NULL DEFAULT 65;

-- CreateTable
CREATE TABLE "TradeOffer" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT,
    "offerResource" TEXT NOT NULL,
    "offerAmount" INTEGER NOT NULL,
    "requestResource" TEXT NOT NULL,
    "requestAmount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TradeOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TradeOffer_status_idx" ON "TradeOffer"("status");

-- CreateIndex
CREATE INDEX "TradeOffer_sellerId_idx" ON "TradeOffer"("sellerId");

-- AddForeignKey
ALTER TABLE "TradeOffer" ADD CONSTRAINT "TradeOffer_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "PlayerState"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeOffer" ADD CONSTRAINT "TradeOffer_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "PlayerState"("id") ON DELETE SET NULL ON UPDATE CASCADE;
