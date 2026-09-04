import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

// Loescht den Account unwiderruflich - Rohstoffe und Muenzen werden NICHT
// erstattet oder uebertragen (sie verlassen einfach den Umlauf, was auch die
// naechste Neuberechnung der Haendler-Preise korrekt widerspiegelt). Offene
// Marktplatz-Angebote dieses Spielers (als Verkaeufer oder Kaeufer) werden
// mitgeloescht, statt sie verwaist zurueckzulassen.
export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ errorCode: "NOT_LOGGED_IN" }, { status: 401 });
  }

  const playerState = await prisma.playerState.findUnique({ where: { userId } });
  if (!playerState) {
    return NextResponse.json({ errorCode: "NO_PLAYER" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.mapRegion.deleteMany({ where: { playerId: playerState.id } }),
    prisma.pendingAction.deleteMany({ where: { playerId: playerState.id } }),
    prisma.tradeOffer.deleteMany({
      where: { OR: [{ sellerId: playerState.id }, { buyerId: playerState.id }] },
    }),
    prisma.playerState.delete({ where: { id: playerState.id } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  return NextResponse.json({ ok: true });
}
