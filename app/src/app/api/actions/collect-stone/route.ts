import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { startTimedAction, ActionError } from "@/lib/actions";
import { COLLECT_STONE_DURATION_MS, computeCollectDurationMs } from "@/lib/game";
import { getWorldState } from "@/lib/world";

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ errorCode: "NOT_LOGGED_IN" }, { status: 401 });
  }

  const world = await getWorldState();

  try {
    await startTimedAction({
      userId,
      type: "collect_stone",
      requireInRegion: "quarry",
      nearStationKey: "collect_stone",
      durationMs: (player) =>
        computeCollectDurationMs({
          baseDurationMs: COLLECT_STONE_DURATION_MS,
          isNight: world.isNight,
          weather: world.weather,
          level: player.level,
          isWaterAction: false,
        }),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ActionError) {
      return NextResponse.json({ errorCode: err.code, ...err.meta }, { status: err.status });
    }
    throw err;
  }
}
