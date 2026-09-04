import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

// Rohe Multiplikator-Zeitreihe fuer /economy - die tatsaechlichen Preise pro
// Rohstoff werden clientseitig ueber effectiveMerchantSellPrice/BuyPrice aus
// den aktuellen Basispreisen abgeleitet (siehe lib/game.ts), damit hier nicht
// fuer jeden der sechs Rohstoffe redundante Zeitreihen uebertragen werden
// muessen.
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ errorCode: "NOT_LOGGED_IN" }, { status: 401 });
  }

  const snapshots = await prisma.priceSnapshot.findMany({
    orderBy: { createdAt: "asc" },
    select: { createdAt: true, sellMultiplier: true, buyMultiplier: true },
  });

  return NextResponse.json({
    snapshots: snapshots.map((s) => ({
      at: s.createdAt,
      sellMultiplier: s.sellMultiplier,
      buyMultiplier: s.buyMultiplier,
    })),
  });
}
