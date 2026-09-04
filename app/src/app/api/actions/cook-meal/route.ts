import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { startTimedAction, ActionError } from "@/lib/actions";
import {
  COOK_MEAL_DURATION_MS,
  COOK_MEAL_FISH_COST,
  COOK_MEAL_VEGETABLE_COST,
  COOK_MEAL_WOOD_COST,
  DEFAULT_FIREPLACE_POSITION,
} from "@/lib/game";

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ errorCode: "NOT_LOGGED_IN" }, { status: 401 });
  }

  try {
    await startTimedAction({
      userId,
      type: "cook_meal",
      requireNear: (player) =>
        player.hasFireplace
          ? {
              x: player.fireplaceX ?? DEFAULT_FIREPLACE_POSITION.x,
              y: player.fireplaceY ?? DEFAULT_FIREPLACE_POSITION.y,
            }
          : null,
      nearStationKey: "cook_meal",
      durationMs: COOK_MEAL_DURATION_MS,
      applyCost: async (tx, player) => {
        if (!player.hasFireplace) {
          throw new ActionError("NO_FIREPLACE");
        }
        if (player.fishCount < COOK_MEAL_FISH_COST) {
          throw new ActionError("NOT_ENOUGH_FISH");
        }
        if (player.vegetableCount < COOK_MEAL_VEGETABLE_COST) {
          throw new ActionError("NOT_ENOUGH_VEGETABLES");
        }
        if (player.woodCount < COOK_MEAL_WOOD_COST) {
          throw new ActionError("NOT_ENOUGH_WOOD");
        }
        await tx.playerState.update({
          where: { id: player.id },
          data: {
            fishCount: { decrement: COOK_MEAL_FISH_COST },
            vegetableCount: { decrement: COOK_MEAL_VEGETABLE_COST },
            woodCount: { decrement: COOK_MEAL_WOOD_COST },
          },
        });
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ActionError) {
      return NextResponse.json({ errorCode: err.code, ...err.meta }, { status: err.status });
    }
    throw err;
  }
}
