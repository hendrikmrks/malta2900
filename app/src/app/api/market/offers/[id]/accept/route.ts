import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { isResourceType, getResourceAmount, resourceDelta } from "@/lib/game";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ errorCode: "NOT_LOGGED_IN" }, { status: 401 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const offer = await tx.tradeOffer.findUnique({ where: { id: params.id } });
      if (!offer || offer.status !== "open") throw new Error("NOT_OPEN");
      if (!isResourceType(offer.offerResource) || !isResourceType(offer.requestResource)) {
        throw new Error("INVALID");
      }

      const buyer = await tx.playerState.findUnique({ where: { userId } });
      if (!buyer) throw new Error("NO_PLAYER");
      if (buyer.id === offer.sellerId) throw new Error("OWN_OFFER");

      if (getResourceAmount(buyer, offer.requestResource) < offer.requestAmount) {
        throw new Error("INSUFFICIENT");
      }

      await tx.playerState.update({
        where: { id: buyer.id },
        data: {
          ...resourceDelta(offer.requestResource, -offer.requestAmount),
          ...resourceDelta(offer.offerResource, offer.offerAmount),
        },
      });

      await tx.playerState.update({
        where: { id: offer.sellerId },
        data: resourceDelta(offer.requestResource, offer.requestAmount),
      });

      await tx.tradeOffer.update({
        where: { id: offer.id },
        data: { status: "completed", buyerId: buyer.id, completedAt: new Date() },
      });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "NOT_OPEN") {
      return NextResponse.json({ errorCode: "OFFER_NOT_AVAILABLE" }, { status: 409 });
    }
    if (message === "OWN_OFFER") {
      return NextResponse.json({ errorCode: "OWN_OFFER" }, { status: 409 });
    }
    if (message === "INSUFFICIENT") {
      return NextResponse.json({ errorCode: "NOT_ENOUGH_FOR_TRADE" }, { status: 409 });
    }
    if (message === "NO_PLAYER") {
      return NextResponse.json({ errorCode: "NO_PLAYER" }, { status: 404 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
}
