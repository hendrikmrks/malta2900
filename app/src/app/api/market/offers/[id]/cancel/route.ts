import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { isResourceType, resourceDelta } from "@/lib/game";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ errorCode: "NOT_LOGGED_IN" }, { status: 401 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const offer = await tx.tradeOffer.findUnique({ where: { id: params.id } });
      if (!offer || offer.status !== "open") throw new Error("NOT_OPEN");
      if (!isResourceType(offer.offerResource)) throw new Error("INVALID");

      const seller = await tx.playerState.findUnique({ where: { userId } });
      if (!seller || seller.id !== offer.sellerId) throw new Error("FORBIDDEN");

      // Eskrow zurueckerstatten.
      await tx.playerState.update({
        where: { id: seller.id },
        data: resourceDelta(offer.offerResource, offer.offerAmount),
      });

      await tx.tradeOffer.update({
        where: { id: offer.id },
        data: { status: "cancelled" },
      });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "NOT_OPEN") {
      return NextResponse.json({ errorCode: "OFFER_NOT_OPEN" }, { status: 409 });
    }
    if (message === "FORBIDDEN") {
      return NextResponse.json({ errorCode: "NOT_YOUR_OFFER" }, { status: 403 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
}
