"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IslandScene, type MapRegionData, type Position } from "@/components/IslandScene";
import { computeWalkDurationMs, distanceBetween } from "@/lib/game";
import { useDict } from "@/lib/i18n/LocaleProvider";
import { apiFetch } from "@/lib/apiFetch";

type VisitState = {
  level: number;
  figCount: number;
  woodCount: number;
  waterCount: number;
  vegetableCount: number;
  fishCount: number;
  stoneCount: number;
  coinCount: number;
  regions: MapRegionData[];
  hasFireplace: boolean;
  fireplaceX: number | null;
  fireplaceY: number | null;
  hasShelter: boolean;
  shelterX: number | null;
  shelterY: number | null;
  shelterLevel: number;
  hasWell: boolean;
  wellX: number | null;
  wellY: number | null;
  hasGarden: boolean;
  gardenX: number | null;
  gardenY: number | null;
  hasStorehouse: boolean;
  storehouseX: number | null;
  storehouseY: number | null;
  pathTiles: { x: number; y: number }[];
  isNight: boolean;
  weather: string;
  posX: number;
  posY: number;
  activeType: string | null;
};

const POLL_INTERVAL_MS = 10_000;

export default function VisitIsland({
  username,
  initialState,
}: {
  username: string;
  initialState: VisitState;
}) {
  const dict = useDict();
  const [state, setState] = useState<VisitState>(initialState);
  // Lokaler, nicht gespeicherter Besucher-Avatar - nur fuer dich sichtbar,
  // rein zum Erkunden waehrend des Besuchs.
  const [guestPosition, setGuestPosition] = useState<Position>({ x: 15, y: 78 });
  const [guestWalkDurationMs, setGuestWalkDurationMs] = useState(1400);
  const guestPositionRef = useRef(guestPosition);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/players/${username}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setState({
        level: data.level,
        figCount: data.figCount,
        woodCount: data.woodCount,
        waterCount: data.waterCount,
        vegetableCount: data.vegetableCount,
        fishCount: data.fishCount,
        stoneCount: data.stoneCount,
        coinCount: data.coinCount,
        regions: data.regions,
        hasFireplace: data.hasFireplace,
        fireplaceX: data.fireplaceX,
        fireplaceY: data.fireplaceY,
        hasShelter: data.hasShelter,
        shelterX: data.shelterX,
        shelterY: data.shelterY,
        shelterLevel: data.shelterLevel,
        hasWell: data.hasWell,
        wellX: data.wellX,
        wellY: data.wellY,
        hasGarden: data.hasGarden,
        gardenX: data.gardenX,
        gardenY: data.gardenY,
        hasStorehouse: data.hasStorehouse,
        storehouseX: data.storehouseX,
        storehouseY: data.storehouseY,
        pathTiles: data.pathTiles,
        isNight: data.isNight,
        weather: data.weather,
        posX: data.posX,
        posY: data.posY,
        activeType: data.activeAction?.type ?? null,
      });
    } catch {
      // Nächster Poll versucht es erneut.
    }
  }, [username]);

  useEffect(() => {
    refresh();
    pollTimer.current = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [refresh]);

  function handleGuestMove(pos: Position) {
    const distance = distanceBetween(guestPositionRef.current, pos);
    setGuestWalkDurationMs(computeWalkDurationMs(distance));
    guestPositionRef.current = pos;
    setGuestPosition(pos);
  }

  return (
    <div className="space-y-6">
      <IslandScene
        state={state}
        activeType={state.activeType}
        title={dict.visit.title(username)}
        headerNote={dict.visit.viewOnlyBadge}
        residentLabel={username}
        residentPosition={{ x: state.posX, y: state.posY }}
        residentInteractive={false}
        residentWalkDurationMs={1800}
        guestPosition={guestPosition}
        onGuestMove={handleGuestMove}
        guestWalkDurationMs={guestWalkDurationMs}
        guestLabel={dict.visit.youLabel}
      />

      <section className="panel">
        <div className="panel-header">
          <span>📋</span>
          <span>{dict.visit.inventoryTitle}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryTile icon="🌿" label={dict.resources.fig} value={state.figCount} />
          <SummaryTile icon="🪵" label={dict.resources.wood} value={state.woodCount} />
          <SummaryTile icon="💧" label={dict.resources.water} value={state.waterCount} />
          <SummaryTile icon="🥕" label={dict.resources.vegetable} value={state.vegetableCount} />
          <SummaryTile icon="🐟" label={dict.resources.fish} value={state.fishCount} />
          <SummaryTile icon="🪨" label={dict.resources.stone} value={state.stoneCount} />
          <SummaryTile icon="🪙" label={dict.resources.coin} value={state.coinCount} />
        </div>
        <p className="mt-4 text-xs text-stone-500">
          {dict.visit.readOnlyNoteBefore}
          <Link href="/market" className="text-turquoise-400 hover:text-turquoise-300">
            {dict.visit.marketLink}
          </Link>
          {dict.visit.readOnlyNoteAfter(username)}
        </p>
      </section>
    </div>
  );
}

function SummaryTile({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="inventory-tile">
      <span className="flex items-center gap-2 text-sm text-stone-300">
        <span className="text-lg">{icon}</span>
        {label}
      </span>
      <span className="font-mono text-base font-bold tabular-nums text-sand-300">{value}</span>
    </div>
  );
}
