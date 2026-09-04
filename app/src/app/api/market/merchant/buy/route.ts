import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import {
  effectiveMerchantBuyPrice,
  effectiveMerchantSellPrice,
  isTradableResourceType,
  resourceDelta,
} from "@/lib/game";
import { getWorldState } from "@/lib/world";

// Kauf beim Haendler: garantiert verfuegbar, auch wenn kein Spieler-Angebot
// existiert - wichtig fuer Inseln ohne das passende Gebiet fuer diesen Rohstoff.
export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ errorCode: "NOT_LOGGED_IN" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const resource = body?.resource;
  const amount = Number(body?.amount);

  if (!isTradableResourceType(resource)) {
    return NextResponse.json({ errorCode: "INVALID_RESOURCE" }, { status: 400 });
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json({ errorCode: "INVALID_AMOUNTS" }, { status: 400 });
  }

  const world = await getWorldState();

  try {
    await prisma.$transaction(async (tx) => {
      const player = await tx.playerState.findUnique({ where: { userId } });
      if (!player) throw new Error("NO_PLAYER");

      const sellPrice = effectiveMerchantSellPrice(resource, world.currencySellMultiplier);
      const cost = effectiveMerchantBuyPrice(resource, world.currencyBuyMultiplier, sellPrice) * amount;
      if (player.coinCount < cost) throw new Error("NOT_ENOUGH_COINS");

      await tx.playerState.update({
        where: { id: player.id },
        data: {
          coinCount: { decrement: cost },
          ...resourceDelta(resource, amount),
        },
      });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "NOT_ENOUGH_COINS") {
      return NextResponse.json({ errorCode: "NOT_ENOUGH_COINS" }, { status: 409 });
    }
    if (message === "NO_PLAYER") {
      return NextResponse.json({ errorCode: "NO_PLAYER" }, { status: 404 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
}
