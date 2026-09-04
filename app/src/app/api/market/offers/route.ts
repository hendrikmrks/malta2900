import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { isResourceType, getResourceAmount, resourceDelta } from "@/lib/game";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ errorCode: "NOT_LOGGED_IN" }, { status: 401 });
  }

  const offers = await prisma.tradeOffer.findMany({
    where: { status: "open" },
    include: { seller: { include: { user: { select: { username: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    offers.map((o) => ({
      id: o.id,
      sellerUsername: o.seller.user.username,
      isOwn: o.seller.userId === userId,
      offerResource: o.offerResource,
      offerAmount: o.offerAmount,
      requestResource: o.requestResource,
      requestAmount: o.requestAmount,
      createdAt: o.createdAt,
    }))
  );
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ errorCode: "NOT_LOGGED_IN" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const offerResource = body?.offerResource;
  const requestResource = body?.requestResource;
  const offerAmount = Number(body?.offerAmount);
  const requestAmount = Number(body?.requestAmount);

  if (!isResourceType(offerResource) || !isResourceType(requestResource)) {
    return NextResponse.json({ errorCode: "INVALID_RESOURCE" }, { status: 400 });
  }
  if (offerResource === requestResource) {
    return NextResponse.json({ errorCode: "SAME_RESOURCE" }, { status: 400 });
  }
  if (
    !Number.isInteger(offerAmount) ||
    offerAmount <= 0 ||
    !Number.isInteger(requestAmount) ||
    requestAmount <= 0
  ) {
    return NextResponse.json({ errorCode: "INVALID_AMOUNTS" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const player = await tx.playerState.findUnique({ where: { userId } });
      if (!player) throw new Error("NO_PLAYER");
      if (getResourceAmount(player, offerResource) < offerAmount) {
        throw new Error("INSUFFICIENT");
      }

      // Eskrow: der angebotene Rohstoff wird sofort abgezogen, damit ein
      // Spieler nicht gleichzeitig online sein muss, um zu handeln.
      await tx.playerState.update({
        where: { id: player.id },
        data: resourceDelta(offerResource, -offerAmount),
      });

      await tx.tradeOffer.create({
        data: {
          sellerId: player.id,
          offerResource,
          offerAmount,
          requestResource,
          requestAmount,
        },
      });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "INSUFFICIENT") {
      return NextResponse.json({ errorCode: "NOT_ENOUGH_FOR_OFFER" }, { status: 409 });
    }
    if (message === "NO_PLAYER") {
      return NextResponse.json({ errorCode: "NO_PLAYER" }, { status: 404 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
}
