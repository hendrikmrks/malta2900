"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PLANT_VEGETABLES_FIG_COST,
  FIREPLACE_WOOD_COST,
  WELL_WOOD_COST,
  WELL_STONE_COST,
  GARDEN_WOOD_COST,
  GARDEN_STONE_COST,
  STOREHOUSE_WOOD_COST,
  STOREHOUSE_STONE_COST,
  COOK_MEAL_FISH_COST,
  COOK_MEAL_VEGETABLE_COST,
  COOK_MEAL_WOOD_COST,
  PATH_STONE_COST,
  MAX_SHELTER_LEVEL,
  shelterUpgradeWoodCost,
  shelterUpgradeStoneCost,
  DEFAULT_SHELTER_POSITION,
  DEFAULT_FIREPLACE_POSITION,
  ACTION_REGION,
  REGION_ACTION,
  computeWalkDurationMs,
  distanceBetween,
  isNearPosition,
  type RegionType,
} from "@/lib/game";
import { useGainFeedback, useJustBecameTrue, useLevelUpFeedback } from "@/lib/hooks";
import {
  IslandScene,
  type MapRegionData,
  type Position,
  type StationActionType,
} from "@/components/IslandScene";
import { useDict, useLocale } from "@/lib/i18n/LocaleProvider";
import { translateApiError } from "@/lib/i18n/errors";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { useToast } from "@/components/Toast";
import { apiFetch } from "@/lib/apiFetch";

type ActiveAction = {
  type: string;
  startedAt: string;
  readyAt: string;
} | null;

type PlayerState = {
  hunger: number;
  thirst: number;
  energy: number;
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
  xp: number;
  level: number;
  xpIntoLevel: number;
  xpPerLevel: number;
  isNight: boolean;
  weather: string;
  posX: number;
  posY: number;
  onboardingDone: boolean;
  activeAction: ActiveAction;
};

const POLL_INTERVAL_MS = 10_000;

const ACTION_PATHS: Record<StationActionType, string> = {
  collect_figs: "/api/actions/collect-fig",
  collect_wood: "/api/actions/collect-wood",
  collect_water: "/api/actions/collect-water",
  collect_fish: "/api/actions/collect-fish",
  collect_stone: "/api/actions/collect-stone",
  plant_vegetables: "/api/actions/plant-vegetables",
  sleep: "/api/actions/sleep",
  cook_meal: "/api/actions/cook-meal",
};

// Farbakzente je Rohstoff - orientieren sich an den Gebiets-Farben auf der
// Karte (siehe REGION_STYLE in IslandScene.tsx), damit auf einen Blick klar
// ist, welches Gebiet welchen Rohstoff liefert.
const RESOURCE_ACCENT: Record<
  "fig" | "wood" | "water" | "vegetable" | "fish" | "stone" | "coin",
  string
> = {
  fig: "border-l-amber-400/70",
  wood: "border-l-green-400/70",
  water: "border-l-cyan-400/70",
  vegetable: "border-l-lime-400/70",
  fish: "border-l-sky-400/70",
  stone: "border-l-zinc-400/70",
  coin: "border-l-yellow-400/70",
};

function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
  }
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export default function Dashboard({ initialState }: { initialState: PlayerState }) {
  const dict = useDict();
  const locale = useLocale();
  const toast = useToast();
  const [state, setState] = useState<PlayerState>(initialState);
  const [position, setPosition] = useState<Position>({ x: initialState.posX, y: initialState.posY });
  const [walkDurationMs, setWalkDurationMs] = useState(1400);
  const [placementMode, setPlacementMode] = useState<
    "fireplace" | "well" | "garden" | "storehouse" | "path" | null
  >(null);
  const [now, setNow] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [barsReady, setBarsReady] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const positionRef = useRef(position);

  const refresh = useCallback(async () => {
    try {
      const res = await apiFetch("/api/state", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as PlayerState;
      setState(data);
    } catch {
      // Nächster Poll versucht es erneut - kein hartes Fehlerbild nötig.
    }
  }, []);

  useEffect(() => {
    // Sofort aktualisieren statt erst nach dem ersten Intervall - sonst zeigt
    // die Seite nach einer Client-Navigation (z.B. vom Marktplatz zurueck)
    // bis zu POLL_INTERVAL_MS lang noch den alten Stand.
    refresh();
    pollTimer.current = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [refresh]);

  // Startet bewusst als `null` statt Date.now(): der Server-Zeitstempel beim
  // SSR-Rendern weicht vom Client-Zeitstempel beim Hydrieren ab, was sonst zu
  // einem React-Hydration-Mismatch im Countdown-Text fuehrt. Erst-Render ist
  // dadurch auf Server und Client identisch (kein "now"), der echte Wert
  // kommt erst nach dem Mount per Effekt hinzu.
  useEffect(() => {
    setNow(Date.now());
    const clockTimer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Balken starten bei 0 % und animieren erst kurz nach dem Mount auf ihren
  // echten Wert, damit die Fuellung sichtbar "einläuft" statt sofort dazustehen.
  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setBarsReady(true))
    );
    return () => cancelAnimationFrame(raf);
  }, []);

  const activeAction = state.activeAction;
  const readyAtMs = activeAction ? new Date(activeAction.readyAt).getTime() : null;
  const secondsLeft =
    readyAtMs !== null && now !== null ? (readyAtMs - now) / 1000 : null;
  const actionDue = secondsLeft !== null && secondsLeft <= 0;

  useEffect(() => {
    if (!actionDue) return;
    const fastPoll = setInterval(refresh, 3000);
    return () => clearInterval(fastPoll);
  }, [actionDue, refresh]);

  const figGain = useGainFeedback(state.figCount);
  const woodGain = useGainFeedback(state.woodCount);
  const waterGain = useGainFeedback(state.waterCount);
  const vegGain = useGainFeedback(state.vegetableCount);
  const fishGain = useGainFeedback(state.fishCount);
  const stoneGain = useGainFeedback(state.stoneCount);
  const coinGain = useGainFeedback(state.coinCount);
  const fireplaceJustBuilt = useJustBecameTrue(state.hasFireplace);
  const shelterJustBuilt = useJustBecameTrue(state.hasShelter);
  const wellJustBuilt = useJustBecameTrue(state.hasWell);
  const gardenJustBuilt = useJustBecameTrue(state.hasGarden);
  const storehouseJustBuilt = useJustBecameTrue(state.hasStorehouse);
  const justLeveledUp = useLevelUpFeedback(state.level);

  async function runAction(path: string, key: string, body?: Position) {
    setBusy(true);
    setPendingKey(key);
    try {
      const res = await apiFetch(path, {
        method: "POST",
        ...(body
          ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
          : {}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.push("error", translateApiError(dict, data, locale));
      }
      await refresh();
    } finally {
      setBusy(false);
      setPendingKey(null);
    }
  }

  /** Bewegt den Charakter clientseitig sofort, mit Dauer proportional zur Distanz. */
  function moveTo(pos: Position) {
    const distance = distanceBetween(positionRef.current, pos);
    const duration = computeWalkDurationMs(distance);
    setWalkDurationMs(duration);
    setPosition(pos);
    positionRef.current = pos;
    return duration;
  }

  function handleFreeMove(pos: Position) {
    moveTo(pos);
    apiFetch("/api/position", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pos),
    }).catch(() => {
      // Naechster Klick versucht es einfach erneut - kein hartes Fehlerbild noetig.
    });
  }

  /** Laeuft zu `pos` und speichert die Position (abgewartet, damit der Server
   * sie kennt) - ohne im Anschluss automatisch etwas zu starten. */
  async function walkTo(pos: Position) {
    const duration = moveTo(pos);
    await new Promise((resolve) => setTimeout(resolve, duration));
    try {
      await apiFetch("/api/position", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pos),
      });
    } catch {
      // Naechster Versuch (erneuter Klick) probiert es einfach erneut.
    }
  }

  /** Laeuft zu `pos`, speichert die Position und fuehrt danach `after` aus -
   * nur fuers Bauen genutzt (dort ist "hinlaufen und platzieren" ein Schritt). */
  async function walkToAndThen(pos: Position, after: () => Promise<void>) {
    await walkTo(pos);
    await after();
  }

  const shelterPosition = {
    x: state.shelterX ?? DEFAULT_SHELTER_POSITION.x,
    y: state.shelterY ?? DEFAULT_SHELTER_POSITION.y,
  };
  const fireplacePosition = {
    x: state.fireplaceX ?? DEFAULT_FIREPLACE_POSITION.x,
    y: state.fireplaceY ?? DEFAULT_FIREPLACE_POSITION.y,
  };

  /** Findet - falls vorhanden - das Gebiet auf der eigenen Insel, das zu einer
   * Sammel-Aktion gehoert. Fehlt es komplett, gibt es hier nichts zu tun (siehe
   * ACTION_REGION in game.ts fuer die feste Zuordnung Aktion -> Gebietstyp). */
  function regionFor(type: StationActionType): MapRegionData | null {
    if (type === "sleep" || type === "cook_meal") return null;
    const regionType: RegionType = ACTION_REGION[type];
    return state.regions.find((r) => r.type === regionType) ?? null;
  }

  // Welche Station (falls ueberhaupt) der Charakter gerade in Reichweite hat -
  // bestimmt, ob ein Klick auf Station/Button hinlaeuft oder direkt startet.
  const nearestStationType = useMemo<StationActionType | null>(() => {
    for (const region of state.regions) {
      if (isNearPosition(position, region, region.radius)) {
        return REGION_ACTION[region.type];
      }
    }
    if (isNearPosition(position, shelterPosition)) {
      return "sleep";
    }
    if (state.hasFireplace && isNearPosition(position, fireplacePosition)) {
      return "cook_meal";
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, state.regions, state.shelterX, state.shelterY, state.hasFireplace, state.fireplaceX, state.fireplaceY]);

  /**
   * Klick auf eine Sammel-/Anbau-/Schlaf-Station (Karte oder Sidebar-Button):
   * ist der Charakter noch nicht dort, laeuft er nur hin - gestartet wird erst
   * mit einem zweiten, bewussten Klick, sobald er angekommen ist. Jeder
   * Spieler hat ab der Registrierung eine Huette, Schlafen ist also immer an
   * deren Standort gebunden - genau wie die uebrigen Gebiets-Aktionen.
   * Fehlt das zugehoerige Gebiet komplett auf der Insel, passiert nichts - der
   * Button wird in diesem Fall gar nicht erst angezeigt (siehe JSX unten).
   */
  function handleStationButtonClick(type: StationActionType) {
    if (activeAction) return;
    if (type === "sleep") {
      if (isNearPosition(position, shelterPosition)) {
        runAction(ACTION_PATHS.sleep, "sleep");
      } else {
        walkTo(shelterPosition);
      }
      return;
    }
    if (type === "cook_meal") {
      if (isNearPosition(position, fireplacePosition)) {
        runAction(ACTION_PATHS.cook_meal, "cook_meal");
      } else {
        walkTo(fireplacePosition);
      }
      return;
    }
    const region = regionFor(type);
    if (!region) return;
    if (isNearPosition(position, region, region.radius)) {
      runAction(ACTION_PATHS[type], type);
    } else {
      walkTo(region);
    }
  }

  function handleGroundClick(pos: Position) {
    // Waehrend eine Aktion laeuft, ist die Insel-Karte gesperrt - erst
    // abbrechen, dann wieder loslaufen.
    if (activeAction) return;
    if (placementMode === "path") {
      // Wege werden direkt am Klickpunkt gelegt (kein Hinlaufen noetig) und
      // der Modus bleibt aktiv - so lassen sich mehrere Kacheln hintereinander
      // setzen, bis bewusst auf "Fertig" geklickt wird (siehe Banner unten).
      runAction("/api/build/path", "build-path", pos);
      return;
    }
    if (placementMode) {
      const building = placementMode;
      setPlacementMode(null);
      walkToAndThen(pos, () => runAction(`/api/craft/${building}`, `craft-${building}`, pos));
      return;
    }
    handleFreeMove(pos);
  }

  const isBusyWithAction = busy || !!activeAction;
  const activeType = activeAction?.type ?? null;
  const actionLabels: Record<string, string> = dict.actionLabels;
  const hasRegion = (type: RegionType) => state.regions.some((r) => r.type === type);
  const hasAnyCollectRegion =
    hasRegion("grove") || hasRegion("forest") || hasRegion("spring") || hasRegion("sea") || hasRegion("quarry");

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {!state.onboardingDone && (
        <Onboarding onComplete={() => setState((s) => ({ ...s, onboardingDone: true }))} />
      )}

      {placementMode && (
        <div className="glass-card animate-fade-in-up flex shrink-0 flex-wrap items-center justify-between gap-3 border-turquoise-400/30 bg-turquoise-500/10 px-4 py-2.5">
          <span className="text-sm text-turquoise-200">
            {placementMode === "fireplace"
              ? dict.dashboard.placement.chooseFireplace
              : placementMode === "well"
                ? dict.dashboard.placement.chooseWell
                : placementMode === "garden"
                  ? dict.dashboard.placement.chooseGarden
                  : placementMode === "storehouse"
                    ? dict.dashboard.placement.chooseStorehouse
                    : dict.dashboard.placement.choosePath}
          </span>
          <button
            className="btn-ghost shrink-0 !px-3 !py-1.5 text-xs"
            onClick={() => setPlacementMode(null)}
          >
            {placementMode === "path"
              ? dict.dashboard.placement.doneButton
              : dict.dashboard.placement.cancelButton}
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        {/* Linke Spalte: Grundwerte, aktive Aktion, Inventar -------------------------------------------------- */}
        <div className="flex shrink-0 flex-col gap-2.5 overflow-y-auto lg:min-h-0 lg:w-64 xl:w-72">
          <section className="panel relative shrink-0 overflow-visible !p-4" style={{ animationDelay: "0ms" }}>
            <div className="panel-header !mb-2.5 !text-[11px]">
              <span>⚡</span>
              <span>{dict.dashboard.basics.title}</span>
            </div>

            <div className="mb-3.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-semibold text-sand-300">
                  <span>🎖️</span> {dict.dashboard.basics.level} {state.level}
                </span>
                <span className="font-mono text-xs tabular-nums text-stone-400">
                  {state.xpIntoLevel}/{state.xpPerLevel} {dict.dashboard.basics.xpSuffix}
                </span>
              </div>
              <div className="stat-track">
                <div
                  className="stat-fill bg-gradient-to-r from-terracotta-400 via-sand-400 to-turquoise-400"
                  style={{
                    width: `${barsReady ? Math.max(0, Math.min(100, (state.xpIntoLevel / state.xpPerLevel) * 100)) : 0}%`,
                  }}
                />
              </div>

              {justLeveledUp && (
                <span className="pointer-events-none absolute -top-3 right-4 animate-pop-up rounded-full bg-gradient-to-r from-terracotta-400 to-sand-300 px-3 py-1 text-xs font-bold text-malta-950 shadow-glow">
                  {dict.dashboard.basics.levelUpToast(state.level)}
                </span>
              )}
            </div>

            <div className="space-y-3.5">
              <Stat label={dict.dashboard.stats.hunger} icon="🍖" value={state.hunger} kind="hunger" ready={barsReady} />
              <Stat label={dict.dashboard.stats.thirst} icon="💧" value={state.thirst} kind="thirst" ready={barsReady} />
              <Stat label={dict.dashboard.stats.energy} icon="⚡" value={state.energy} kind="energy" ready={barsReady} />
            </div>
          </section>

          {activeAction && (
            <div
              className="glass-card animate-fade-in-up shrink-0 border-turquoise-400/25 bg-turquoise-500/[0.06] px-4 py-3"
              style={{ animationDelay: "60ms" }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-turquoise-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-turquoise-400" />
                  </span>
                  <span className="text-xs font-medium text-stone-200">
                    {dict.dashboard.activeAction.running(
                      actionLabels[activeAction.type] ?? activeAction.type
                    )}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-turquoise-300">
                  {secondsLeft === null
                    ? "…"
                    : actionDue
                      ? dict.dashboard.activeAction.completing
                      : formatDuration(secondsLeft)}
                </span>
              </div>

              <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-white/10 pt-2.5">
                <span className="text-[11px] leading-tight text-stone-400">
                  {activeAction.type === "plant_vegetables"
                    ? dict.dashboard.activeAction.cancelNoteVegetables
                    : activeAction.type === "cook_meal"
                      ? dict.dashboard.activeAction.cancelNoteMeal
                      : dict.dashboard.activeAction.cancelNoteDefault}
                </span>
                <button
                  className="btn-ghost shrink-0 !px-2.5 !py-1 text-xs"
                  disabled={busy}
                  onClick={() => runAction("/api/actions/cancel", "cancel")}
                >
                  {pendingKey === "cancel" ? <Spinner /> : "✕"}
                </button>
              </div>
            </div>
          )}

          <section className="panel shrink-0 !p-3.5" style={{ animationDelay: "120ms" }}>
            <div className="panel-header !mb-2 !text-[11px]">
              <span>🎒</span>
              <span>{dict.dashboard.inventory.title}</span>
            </div>

            {/* Waehrung: eigene, hervorgehobene Zeile statt ein Grid-Feld unter
                vielen - Muenzen sind etwas anderes als Rohstoffe. */}
            <div className="relative mb-3 flex items-center justify-between overflow-visible rounded-xl border border-yellow-400/25 bg-yellow-400/[0.07] px-3 py-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-yellow-200">
                <span className="text-lg">🪙</span> {dict.dashboard.inventory.coins}
              </span>
              <span className="font-mono text-base font-bold tabular-nums text-yellow-300">
                {state.coinCount}
              </span>
              {coinGain && (
                <span
                  key={coinGain.key}
                  className="pointer-events-none absolute -top-2 right-3 animate-pop-up font-mono text-xs font-bold text-yellow-300"
                >
                  +{coinGain.amount}
                </span>
              )}
            </div>

            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-sand-400">
              {dict.dashboard.inventory.resourcesTitle}
            </p>
            <div className="mb-3 grid grid-cols-2 gap-1.5">
              <InventoryTile
                icon="🌿"
                label={dict.dashboard.inventory.figs}
                value={state.figCount}
                gain={figGain}
                accent={RESOURCE_ACCENT.fig}
              />
              <InventoryTile
                icon="🪵"
                label={dict.dashboard.inventory.wood}
                value={state.woodCount}
                gain={woodGain}
                accent={RESOURCE_ACCENT.wood}
              />
              <InventoryTile
                icon="💧"
                label={dict.dashboard.inventory.water}
                value={state.waterCount}
                gain={waterGain}
                accent={RESOURCE_ACCENT.water}
              />
              <InventoryTile
                icon="🥕"
                label={dict.dashboard.inventory.vegetable}
                value={state.vegetableCount}
                gain={vegGain}
                accent={RESOURCE_ACCENT.vegetable}
              />
              <InventoryTile
                icon="🐟"
                label={dict.dashboard.inventory.fish}
                value={state.fishCount}
                gain={fishGain}
                accent={RESOURCE_ACCENT.fish}
              />
              <InventoryTile
                icon="🪨"
                label={dict.dashboard.inventory.stone}
                value={state.stoneCount}
                gain={stoneGain}
                accent={RESOURCE_ACCENT.stone}
              />
            </div>

            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-sand-400">
              {dict.dashboard.inventory.villageTitle}
            </p>
            <div className="space-y-1.5">
              <BuildingTile
                icon="🔥"
                label={dict.dashboard.inventory.fireplace}
                built={state.hasFireplace}
                justBuilt={fireplaceJustBuilt}
                builtLabel={dict.dashboard.inventory.built}
                openLabel={dict.dashboard.inventory.open}
                costBadges={
                  !state.hasFireplace && (
                    <CostBadge icon="🪵" have={state.woodCount} need={FIREPLACE_WOOD_COST} />
                  )
                }
              />
              <BuildingTile
                icon="🛖"
                label={dict.dashboard.inventory.shelter}
                built={state.hasShelter}
                justBuilt={shelterJustBuilt}
                builtLabel={dict.dashboard.inventory.built}
                openLabel={dict.dashboard.inventory.open}
                badgeOverride={`Lv.${state.shelterLevel}`}
                costBadges={
                  state.shelterLevel < MAX_SHELTER_LEVEL && (
                    <>
                      <CostBadge
                        icon="🪵"
                        have={state.woodCount}
                        need={shelterUpgradeWoodCost(state.shelterLevel + 1)}
                      />
                      <CostBadge
                        icon="🪨"
                        have={state.stoneCount}
                        need={shelterUpgradeStoneCost(state.shelterLevel + 1)}
                      />
                    </>
                  )
                }
              />
              <BuildingTile
                icon="⛲"
                label={dict.dashboard.inventory.well}
                built={state.hasWell}
                justBuilt={wellJustBuilt}
                builtLabel={dict.dashboard.inventory.built}
                openLabel={dict.dashboard.inventory.open}
                costBadges={
                  !state.hasWell && (
                    <>
                      <CostBadge icon="🪵" have={state.woodCount} need={WELL_WOOD_COST} />
                      <CostBadge icon="🪨" have={state.stoneCount} need={WELL_STONE_COST} />
                    </>
                  )
                }
              />
              <BuildingTile
                icon="🌻"
                label={dict.dashboard.inventory.garden}
                built={state.hasGarden}
                justBuilt={gardenJustBuilt}
                builtLabel={dict.dashboard.inventory.built}
                openLabel={dict.dashboard.inventory.open}
                costBadges={
                  !state.hasGarden && (
                    <>
                      <CostBadge icon="🪵" have={state.woodCount} need={GARDEN_WOOD_COST} />
                      <CostBadge icon="🪨" have={state.stoneCount} need={GARDEN_STONE_COST} />
                    </>
                  )
                }
              />
              <BuildingTile
                icon="🏺"
                label={dict.dashboard.inventory.storehouse}
                built={state.hasStorehouse}
                justBuilt={storehouseJustBuilt}
                builtLabel={dict.dashboard.inventory.built}
                openLabel={dict.dashboard.inventory.open}
                costBadges={
                  !state.hasStorehouse && (
                    <>
                      <CostBadge icon="🪵" have={state.woodCount} need={STOREHOUSE_WOOD_COST} />
                      <CostBadge icon="🪨" have={state.stoneCount} need={STOREHOUSE_STONE_COST} />
                    </>
                  )
                }
              />
            </div>
          </section>
        </div>

        {/* Mitte: die Karte - Hauptkomponente -------------------------------------------------- */}
        <div className="min-h-[320px] min-w-0 flex-1">
          <IslandScene
            state={state}
            activeType={activeType}
            residentPosition={position}
            residentInteractive
            residentWalkDurationMs={walkDurationMs}
            onGroundClick={handleGroundClick}
            onStationAction={handleStationButtonClick}
            placementMode={placementMode}
            locked={!!activeAction}
          />
        </div>

        {/* Rechte Spalte: kompakte Aktionen -------------------------------------------------- */}
        <div className="flex shrink-0 flex-col gap-2.5 overflow-y-auto lg:min-h-0 lg:w-64 xl:w-72">
          <section className="panel shrink-0 space-y-3 !p-3.5">
            <ActionGroup
              icon="🧺"
              title={dict.dashboard.actions.collectTitle}
              hint={hasAnyCollectRegion ? dict.dashboard.actions.collectHint : dict.dashboard.actions.noRegionsHint}
            >
              {hasRegion("grove") && (
                <ActionButton
                  icon="🌿"
                  label={dict.dashboard.actions.collectFig}
                  disabled={isBusyWithAction}
                  pending={pendingKey === "collect_figs"}
                  running={activeType === "collect_figs"}
                  ready={nearestStationType === "collect_figs"}
                  onClick={() => handleStationButtonClick("collect_figs")}
                  compact
                />
              )}
              {hasRegion("forest") && (
                <ActionButton
                  icon="🪵"
                  label={dict.dashboard.actions.collectWood}
                  disabled={isBusyWithAction}
                  pending={pendingKey === "collect_wood"}
                  running={activeType === "collect_wood"}
                  ready={nearestStationType === "collect_wood"}
                  onClick={() => handleStationButtonClick("collect_wood")}
                  compact
                />
              )}
              {hasRegion("spring") && (
                <ActionButton
                  icon="💧"
                  label={dict.dashboard.actions.collectWater}
                  disabled={isBusyWithAction}
                  pending={pendingKey === "collect_water"}
                  running={activeType === "collect_water"}
                  ready={nearestStationType === "collect_water"}
                  onClick={() => handleStationButtonClick("collect_water")}
                  compact
                />
              )}
              {hasRegion("sea") && (
                <ActionButton
                  icon="🐟"
                  label={dict.dashboard.actions.collectFish}
                  disabled={isBusyWithAction}
                  pending={pendingKey === "collect_fish"}
                  running={activeType === "collect_fish"}
                  ready={nearestStationType === "collect_fish"}
                  onClick={() => handleStationButtonClick("collect_fish")}
                  compact
                />
              )}
              {hasRegion("quarry") && (
                <ActionButton
                  icon="🪨"
                  label={dict.dashboard.actions.collectStone}
                  disabled={isBusyWithAction}
                  pending={pendingKey === "collect_stone"}
                  running={activeType === "collect_stone"}
                  ready={nearestStationType === "collect_stone"}
                  onClick={() => handleStationButtonClick("collect_stone")}
                  compact
                />
              )}
            </ActionGroup>

            <ActionGroup icon="🍽️" title={dict.dashboard.actions.consumeTitle}>
              <button
                className="btn-secondary !px-3 !py-1.5 text-xs"
                disabled={busy || state.figCount <= 0}
                onClick={() => runAction("/api/actions/eat-fig", "eat-fig")}
              >
                {pendingKey === "eat-fig" ? <Spinner /> : "🌿"} {dict.dashboard.actions.eatFig}
              </button>
              <button
                className="btn-secondary !px-3 !py-1.5 text-xs"
                disabled={busy || state.fishCount <= 0}
                onClick={() => runAction("/api/actions/eat-fish", "eat-fish")}
              >
                {pendingKey === "eat-fish" ? <Spinner /> : "🐟"} {dict.dashboard.actions.eatFish}
              </button>
              <button
                className="btn-secondary !px-3 !py-1.5 text-xs"
                disabled={busy || state.waterCount <= 0}
                onClick={() => runAction("/api/actions/drink-water", "drink-water")}
              >
                {pendingKey === "drink-water" ? <Spinner /> : "💧"} {dict.dashboard.actions.drinkWater}
              </button>
            </ActionGroup>

            <ActionGroup
              icon="🌱"
              title={dict.dashboard.actions.growSleepTitle}
              hint={dict.dashboard.actions.growSleepHint}
            >
              {hasRegion("field") && (
                <ActionButton
                  icon="🥕"
                  label={dict.dashboard.actions.plantVegetables(PLANT_VEGETABLES_FIG_COST)}
                  disabled={isBusyWithAction || state.figCount < PLANT_VEGETABLES_FIG_COST}
                  pending={pendingKey === "plant_vegetables"}
                  running={activeType === "plant_vegetables"}
                  ready={nearestStationType === "plant_vegetables"}
                  onClick={() => handleStationButtonClick("plant_vegetables")}
                  compact
                />
              )}
              {state.hasFireplace && (
                <ActionButton
                  icon="🍲"
                  label={dict.dashboard.actions.cookMeal}
                  disabled={
                    isBusyWithAction ||
                    state.fishCount < COOK_MEAL_FISH_COST ||
                    state.vegetableCount < COOK_MEAL_VEGETABLE_COST ||
                    state.woodCount < COOK_MEAL_WOOD_COST
                  }
                  pending={pendingKey === "cook_meal"}
                  running={activeType === "cook_meal"}
                  ready={nearestStationType === "cook_meal"}
                  onClick={() => handleStationButtonClick("cook_meal")}
                  compact
                />
              )}
              <ActionButton
                icon="🌙"
                label={dict.dashboard.actions.sleep}
                disabled={isBusyWithAction}
                pending={pendingKey === "sleep"}
                running={activeType === "sleep"}
                ready={nearestStationType === "sleep"}
                onClick={() => handleStationButtonClick("sleep")}
                compact
              />
            </ActionGroup>

            <ActionGroup icon="🏗️" title={dict.dashboard.actions.buildTitle} layout="col">
              <BuildCard
                icon="🔥"
                label={
                  state.hasFireplace
                    ? dict.dashboard.actions.fireplaceBuilt
                    : placementMode === "fireplace"
                      ? dict.dashboard.actions.choosingSpot
                      : dict.dashboard.inventory.fireplace
                }
                disabled={
                  isBusyWithAction ||
                  state.hasFireplace ||
                  state.woodCount < FIREPLACE_WOOD_COST ||
                  placementMode !== null
                }
                pending={false}
                onClick={() => setPlacementMode("fireplace")}
                costBadges={
                  !state.hasFireplace && (
                    <CostBadge icon="🪵" have={state.woodCount} need={FIREPLACE_WOOD_COST} />
                  )
                }
              />
              <BuildCard
                icon="🛖"
                label={
                  state.shelterLevel >= MAX_SHELTER_LEVEL
                    ? dict.dashboard.actions.shelterMaxLevel
                    : dict.dashboard.actions.upgradeShelter(state.shelterLevel + 1)
                }
                disabled={
                  isBusyWithAction ||
                  state.shelterLevel >= MAX_SHELTER_LEVEL ||
                  state.woodCount < shelterUpgradeWoodCost(state.shelterLevel + 1) ||
                  state.stoneCount < shelterUpgradeStoneCost(state.shelterLevel + 1) ||
                  placementMode !== null
                }
                pending={pendingKey === "upgrade-shelter"}
                onClick={() => runAction("/api/craft/shelter", "upgrade-shelter")}
                costBadges={
                  state.shelterLevel < MAX_SHELTER_LEVEL && (
                    <>
                      <CostBadge
                        icon="🪵"
                        have={state.woodCount}
                        need={shelterUpgradeWoodCost(state.shelterLevel + 1)}
                      />
                      <CostBadge
                        icon="🪨"
                        have={state.stoneCount}
                        need={shelterUpgradeStoneCost(state.shelterLevel + 1)}
                      />
                    </>
                  )
                }
              />
              <BuildCard
                icon="⛲"
                label={
                  state.hasWell
                    ? dict.dashboard.actions.wellBuilt
                    : placementMode === "well"
                      ? dict.dashboard.actions.choosingSpot
                      : dict.dashboard.inventory.well
                }
                disabled={
                  isBusyWithAction ||
                  state.hasWell ||
                  state.woodCount < WELL_WOOD_COST ||
                  state.stoneCount < WELL_STONE_COST ||
                  placementMode !== null
                }
                pending={false}
                onClick={() => setPlacementMode("well")}
                costBadges={
                  !state.hasWell && (
                    <>
                      <CostBadge icon="🪵" have={state.woodCount} need={WELL_WOOD_COST} />
                      <CostBadge icon="🪨" have={state.stoneCount} need={WELL_STONE_COST} />
                    </>
                  )
                }
              />
              <BuildCard
                icon="🌻"
                label={
                  state.hasGarden
                    ? dict.dashboard.actions.gardenBuilt
                    : placementMode === "garden"
                      ? dict.dashboard.actions.choosingSpot
                      : dict.dashboard.inventory.garden
                }
                disabled={
                  isBusyWithAction ||
                  state.hasGarden ||
                  state.woodCount < GARDEN_WOOD_COST ||
                  state.stoneCount < GARDEN_STONE_COST ||
                  placementMode !== null
                }
                pending={false}
                onClick={() => setPlacementMode("garden")}
                costBadges={
                  !state.hasGarden && (
                    <>
                      <CostBadge icon="🪵" have={state.woodCount} need={GARDEN_WOOD_COST} />
                      <CostBadge icon="🪨" have={state.stoneCount} need={GARDEN_STONE_COST} />
                    </>
                  )
                }
              />
              <BuildCard
                icon="🏺"
                label={
                  state.hasStorehouse
                    ? dict.dashboard.actions.storehouseBuilt
                    : placementMode === "storehouse"
                      ? dict.dashboard.actions.choosingSpot
                      : dict.dashboard.inventory.storehouse
                }
                disabled={
                  isBusyWithAction ||
                  state.hasStorehouse ||
                  state.woodCount < STOREHOUSE_WOOD_COST ||
                  state.stoneCount < STOREHOUSE_STONE_COST ||
                  placementMode !== null
                }
                pending={false}
                onClick={() => setPlacementMode("storehouse")}
                costBadges={
                  !state.hasStorehouse && (
                    <>
                      <CostBadge icon="🪵" have={state.woodCount} need={STOREHOUSE_WOOD_COST} />
                      <CostBadge icon="🪨" have={state.stoneCount} need={STOREHOUSE_STONE_COST} />
                    </>
                  )
                }
              />
              <BuildCard
                icon="🛤️"
                label={
                  placementMode === "path"
                    ? dict.dashboard.actions.layingPath
                    : dict.dashboard.actions.buildPath
                }
                disabled={isBusyWithAction || placementMode !== null}
                pending={false}
                onClick={() => setPlacementMode("path")}
                costBadges={
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-stone-400">
                    🪨 {PATH_STONE_COST} {dict.dashboard.actions.perTile}
                  </span>
                }
              />
            </ActionGroup>
          </section>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent align-[-2px]" />
  );
}

function ActionGroup({
  icon,
  title,
  hint,
  layout = "row",
  children,
}: {
  icon: string;
  title: string;
  hint?: string;
  /** "col" stapelt die Kinder als volle Breite (fuer die Bauen-Karten mit
   * Kosten-Badges), "row" laesst sie wie bisher nebeneinander umbrechen. */
  layout?: "row" | "col";
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sand-400">
        <span>{icon}</span>
        <span>{title}</span>
      </div>
      {hint && <p className="mb-2 text-[10px] leading-snug text-stone-500">{hint}</p>}
      <div className={layout === "col" ? "space-y-1.5" : "flex flex-wrap gap-2"}>{children}</div>
    </div>
  );
}

/** Volle-Breite-Baukarte mit Titel + Kosten-Fortschritt statt einer reinen
 * Text-Schaltflaeche - macht auf einen Blick klar, was noch fehlt. */
function BuildCard({
  icon,
  label,
  costBadges,
  disabled,
  pending,
  onClick,
}: {
  icon: string;
  label: React.ReactNode;
  costBadges?: React.ReactNode;
  disabled: boolean;
  pending: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-left text-xs transition hover:bg-white/[0.07] hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white/[0.04] disabled:hover:border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turquoise-400/60"
      disabled={disabled}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-stone-200">
          {icon} {label}
        </span>
        {pending && <Spinner />}
      </div>
      {costBadges && <div className="mt-1.5 flex flex-wrap gap-1.5">{costBadges}</div>}
    </button>
  );
}

function ActionButton({
  icon,
  label,
  disabled,
  pending,
  running,
  ready = false,
  onClick,
  compact = false,
}: {
  icon: string;
  label: React.ReactNode;
  disabled: boolean;
  pending: boolean;
  running: boolean;
  /** Charakter steht bereits an der Station - Klick startet direkt statt hinzulaufen. */
  ready?: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      className={`btn-primary ${compact ? "!px-3 !py-1.5 text-xs" : ""} ${
        running
          ? "!opacity-100 ring-2 ring-turquoise-300/60 shadow-glow"
          : ready
            ? "ring-2 ring-sand-300/50"
            : ""
      }`}
      disabled={disabled}
      onClick={onClick}
    >
      {pending ? (
        <Spinner />
      ) : running ? (
        <span className="animate-pulse">{icon}</span>
      ) : (
        <span>{ready ? icon : "🚶"}</span>
      )}{" "}
      {label}
    </button>
  );
}

function Stat({
  label,
  icon,
  value,
  kind,
  ready,
}: {
  label: string;
  icon: string;
  value: number;
  kind: "hunger" | "thirst" | "energy";
  ready: boolean;
}) {
  const rounded = Math.round(value);
  const fillClass = {
    hunger: "bg-gradient-to-r from-terracotta-500 to-terracotta-400",
    thirst: "bg-gradient-to-r from-turquoise-600 to-turquoise-400",
    energy: "bg-gradient-to-r from-sand-600 to-sand-400",
  }[kind];

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-stone-300">
          <span>{icon}</span>
          {label}
        </span>
        <span className="font-mono tabular-nums text-stone-400">{rounded}/100</span>
      </div>
      <div className="stat-track">
        <div
          className={`stat-fill ${fillClass}`}
          style={{ width: `${ready ? Math.max(0, Math.min(100, rounded)) : 0}%` }}
        />
      </div>
    </div>
  );
}

function InventoryTile({
  icon,
  label,
  value,
  gain,
  accent,
}: {
  icon: string;
  label: string;
  value: number;
  gain: ReturnType<typeof useGainFeedback>;
  /** Linker Farbrand passend zum liefernden Gebiet auf der Karte (siehe
   * RESOURCE_ACCENT) - hilft, Vorrat und Sammel-Gebiet visuell zu verknuepfen. */
  accent: string;
}) {
  return (
    <div
      className={`inventory-tile relative overflow-visible !py-2 border-l-2 ${accent} ${
        gain ? "animate-pulse-ring border-turquoise-400/50 bg-turquoise-500/10" : ""
      }`}
    >
      <span className="flex items-center gap-2 text-sm text-stone-300">
        <span className="text-lg">{icon}</span>
        {label}
      </span>
      <span className="font-mono text-base font-bold tabular-nums text-sand-300">{value}</span>
      {gain && (
        <span
          key={gain.key}
          className="pointer-events-none absolute -top-2 right-3 animate-pop-up font-mono text-xs font-bold text-turquoise-300"
        >
          +{gain.amount}
        </span>
      )}
    </div>
  );
}

/** Kompakte "X/Y"-Anzeige fuer eine Baukosten-Ressource - gruen sobald genug
 * vorhanden ist, sonst neutral. Macht auf einen Blick klar, wie viel noch
 * fehlt, statt nur einen deaktivierten Button zu zeigen. */
function CostBadge({ icon, have, need }: { icon: string; have: number; need: number }) {
  const met = have >= need;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[10px] tabular-nums ${
        met ? "bg-turquoise-500/15 text-turquoise-300" : "bg-white/5 text-stone-400"
      }`}
    >
      {icon} {Math.min(have, need)}/{need}
    </span>
  );
}

function BuildingTile({
  icon,
  label,
  built,
  justBuilt,
  builtLabel,
  openLabel,
  /** Ueberschreibt das built/open-Badge mit einem festen Text (z.B. Level) -
   * fuer Gebaeude, die (wie die Huette) immer vorhanden sind und stattdessen
   * eine Ausbaustufe zeigen. */
  badgeOverride,
  /** Fortschritts-Badges (siehe CostBadge) - zeigen bei nicht gebauten oder
   * ausbaubaren Gebaeuden direkt, wie viel von welchem Rohstoff noch fehlt. */
  costBadges,
}: {
  icon: string;
  label: string;
  built: boolean;
  justBuilt: boolean;
  builtLabel: string;
  openLabel: string;
  badgeOverride?: string;
  costBadges?: React.ReactNode;
}) {
  return (
    <div className="inventory-tile !flex-col !items-stretch !gap-1.5 !py-2.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm text-stone-300">
          <span className={`text-lg ${justBuilt ? "animate-build-in" : ""}`}>{icon}</span>
          {label}
        </span>
        <span className={built ? "badge-on" : "badge-off"}>
          {badgeOverride ?? (built ? builtLabel : openLabel)}
        </span>
      </div>
      {costBadges && <div className="flex flex-wrap gap-1.5 pl-7">{costBadges}</div>}
    </div>
  );
}
