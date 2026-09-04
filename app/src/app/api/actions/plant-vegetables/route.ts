import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { startTimedAction, ActionError } from "@/lib/actions";
import { PLANT_VEGETABLES_DURATION_MS, PLANT_VEGETABLES_FIG_COST } from "@/lib/game";

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ errorCode: "NOT_LOGGED_IN" }, { status: 401 });
  }

  try {
    await startTimedAction({
      userId,
      type: "plant_vegetables",
      requireInRegion: "field",
      nearStationKey: "plant_vegetables",
      durationMs: PLANT_VEGETABLES_DURATION_MS,
      applyCost: async (tx, player) => {
        if (player.figCount < PLANT_VEGETABLES_FIG_COST) {
          throw new ActionError("NOT_ENOUGH_SEED_FIGS");
        }
        await tx.playerState.update({
          where: { id: player.id },
          data: { figCount: { decrement: PLANT_VEGETABLES_FIG_COST } },
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
