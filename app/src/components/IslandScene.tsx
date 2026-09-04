"use client";

import { useJustBecameTrue, useWalkingFlag } from "@/lib/hooks";
import { useDict } from "@/lib/i18n/LocaleProvider";
import {
  DEFAULT_FIREPLACE_POSITION,
  DEFAULT_GARDEN_POSITION,
  DEFAULT_SHELTER_POSITION,
  DEFAULT_STOREHOUSE_POSITION,
  DEFAULT_WELL_POSITION,
  PATH_GRID_STEP,
  REGION_ACTION,
  REGION_ICON,
  REGION_RESOURCE,
  RESOURCE_FIELD,
  isNearPosition,
  type GatherActionType,
  type Position,
  type RegionType,
} from "@/lib/game";

export type { Position };

export type MapRegionData = { type: RegionType; x: number; y: number; radius: number };

export type IslandVisualState = {
  figCount: number;
  woodCount: number;
  waterCount: number;
  vegetableCount: number;
  fishCount: number;
  stoneCount: number;
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
};

export type StationActionType = GatherActionType | "sleep" | "cook_meal";

// Visuelle Einfaerbung je Gebietstyp - rein dekorativ, hat keinen Einfluss auf
// die Spiellogik (die richtet sich nach dem tatsaechlichen `radius` je Gebiet).
// Alle Klassen als vollstaendige Literale (nicht per Stringverkettung zur
// Laufzeit zusammengesetzt) - Tailwinds JIT-Scanner findet nur Klassennamen,
// die woertlich im Quellcode stehen.
const REGION_STYLE: Record<
  RegionType,
  { fill: string; ring: string; enteredFill: string; enteredRing: string }
> = {
  grove: {
    fill: "bg-amber-400/10",
    ring: "ring-amber-300/30",
    enteredFill: "bg-amber-400/25",
    enteredRing: "ring-amber-300/80",
  },
  forest: {
    fill: "bg-green-500/10",
    ring: "ring-green-400/30",
    enteredFill: "bg-green-500/25",
    enteredRing: "ring-green-400/80",
  },
  spring: {
    fill: "bg-cyan-400/10",
    ring: "ring-cyan-300/30",
    enteredFill: "bg-cyan-400/25",
    enteredRing: "ring-cyan-300/80",
  },
  field: {
    fill: "bg-lime-400/10",
    ring: "ring-lime-300/30",
    enteredFill: "bg-lime-400/25",
    enteredRing: "ring-lime-300/80",
  },
  sea: {
    fill: "bg-sky-400/10",
    ring: "ring-sky-300/30",
    enteredFill: "bg-sky-400/25",
    enteredRing: "ring-sky-300/80",
  },
  quarry: {
    fill: "bg-zinc-400/10",
    ring: "ring-zinc-300/30",
    enteredFill: "bg-zinc-400/25",
    enteredRing: "ring-zinc-300/80",
  },
};

// Feste Positionen statt Math.random() im Render - sonst weichen Server- und
// Client-Render voneinander ab (React-Hydration-Mismatch).
const RAINDROPS = [
  { left: "6%", delay: "0s" },
  { left: "16%", delay: "0.3s" },
  { left: "24%", delay: "0.6s" },
  { left: "33%", delay: "0.15s" },
  { left: "41%", delay: "0.45s" },
  { left: "50%", delay: "0.75s" },
  { left: "58%", delay: "0.2s" },
  { left: "67%", delay: "0.5s" },
  { left: "75%", delay: "0.1s" },
  { left: "83%", delay: "0.65s" },
  { left: "91%", delay: "0.35s" },
  { left: "97%", delay: "0.55s" },
];

const NIGHT_STARS = [
  { top: "12%", left: "12%", delay: "0s" },
  { top: "22%", left: "28%", delay: "0.4s" },
  { top: "8%", left: "45%", delay: "0.8s" },
  { top: "30%", left: "58%", delay: "1.2s" },
  { top: "16%", left: "70%", delay: "0.6s" },
  { top: "26%", left: "85%", delay: "1s" },
  { top: "10%", left: "92%", delay: "0.2s" },
];

const CLOUDS = [
  { top: "0px", left: "0px" },
  { top: "6px", left: "0px" },
  { top: "2px", left: "0px" },
  { top: "8px", left: "0px" },
];

const MAP_DECOR = [
  { left: "6%", top: "80%", icon: "🐚" },
  { left: "12%", top: "18%", icon: "🌾" },
  { left: "28%", top: "85%", icon: "🌾" },
  { left: "36%", top: "12%", icon: "🐚" },
  { left: "52%", top: "78%", icon: "🌾" },
  { left: "58%", top: "20%", icon: "🐚" },
  { left: "74%", top: "84%", icon: "🌾" },
  { left: "79%", top: "15%", icon: "🐚" },
  { left: "93%", top: "72%", icon: "🌾" },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function IslandScene({
  state,
  activeType,
  title,
  headerNote,
  residentLabel,
  residentPosition,
  residentInteractive = false,
  residentWalkDurationMs = 1400,
  onGroundClick,
  onStationAction,
  placementMode = null,
  locked = false,
  guestPosition,
  onGuestMove,
  guestWalkDurationMs = 1400,
  guestLabel,
}: {
  state: IslandVisualState;
  activeType: string | null;
  title?: string;
  headerNote?: string;
  residentLabel?: string;
  residentPosition: Position;
  residentInteractive?: boolean;
  residentWalkDurationMs?: number;
  onGroundClick?: (pos: Position) => void;
  onStationAction?: (type: StationActionType) => void;
  placementMode?: "fireplace" | "well" | "garden" | "storehouse" | "path" | null;
  /** Waehrend eine Aktion laeuft, ist die Karte gesperrt - erst abbrechen, dann wieder loslaufen. */
  locked?: boolean;
  guestPosition?: Position | null;
  onGuestMove?: (pos: Position) => void;
  guestWalkDurationMs?: number;
  guestLabel?: string;
}) {
  const dict = useDict();
  const resolvedTitle = title ?? dict.dashboard.island.title;
  const resolvedGuestLabel = guestLabel ?? "";
  const fireplaceJustBuilt = useJustBecameTrue(state.hasFireplace);
  const shelterJustBuilt = useJustBecameTrue(state.hasShelter);
  const wellJustBuilt = useJustBecameTrue(state.hasWell);
  const gardenJustBuilt = useJustBecameTrue(state.hasGarden);
  const storehouseJustBuilt = useJustBecameTrue(state.hasStorehouse);
  const resident = useWalkingFlag(residentPosition.x, residentWalkDurationMs);
  const guest = useWalkingFlag(guestPosition?.x ?? 0, guestWalkDurationMs);

  // Die Huette ist ab der Registrierung immer vorhanden (kein optionaler Bau
  // mehr) - der Baufortschritt zaehlt daher Feuerstelle + Brunnen, beides
  // weiterhin ueber Crafting erarbeitete Dorf-Erweiterungen.
  const builtCount =
    Number(state.hasFireplace) +
    Number(state.hasWell) +
    Number(state.hasGarden) +
    Number(state.hasStorehouse);
  const isNight = state.isNight;
  const isRainy = state.weather === "rainy";
  const isCloudy = state.weather === "cloudy";
  // Sonne ist ausschliesslich am Tag sichtbar - nachts zeigt derselbe
  // Wetterzustand ("sunny" = keine Wolken/kein Regen) stattdessen einen
  // klaren Nachthimmel.
  const isClearSky = !isRainy && !isCloudy;
  const clickable = (residentInteractive && !locked) || !!guestPosition;
  const stationsInteractive = residentInteractive && !placementMode && !locked;

  const fireplacePos: Position = {
    x: state.fireplaceX ?? DEFAULT_FIREPLACE_POSITION.x,
    y: state.fireplaceY ?? DEFAULT_FIREPLACE_POSITION.y,
  };
  const shelterPos: Position = {
    x: state.shelterX ?? DEFAULT_SHELTER_POSITION.x,
    y: state.shelterY ?? DEFAULT_SHELTER_POSITION.y,
  };
  const wellPos: Position = {
    x: state.wellX ?? DEFAULT_WELL_POSITION.x,
    y: state.wellY ?? DEFAULT_WELL_POSITION.y,
  };
  const gardenPos: Position = {
    x: state.gardenX ?? DEFAULT_GARDEN_POSITION.x,
    y: state.gardenY ?? DEFAULT_GARDEN_POSITION.y,
  };
  const storehousePos: Position = {
    x: state.storehouseX ?? DEFAULT_STOREHOUSE_POSITION.x,
    y: state.storehouseY ?? DEFAULT_STOREHOUSE_POSITION.y,
  };

  function handleGroundClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos: Position = {
      x: clamp(((e.clientX - rect.left) / rect.width) * 100, 3, 97),
      y: clamp(((e.clientY - rect.top) / rect.height) * 100, 6, 94),
    };
    if (residentInteractive && onGroundClick) {
      onGroundClick(pos);
    } else if (guestPosition && onGuestMove) {
      onGuestMove(pos);
    }
  }

  function stationHandler(type: StationActionType) {
    if (!stationsInteractive || !onStationAction) return undefined;
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      onStationAction(type);
    };
  }

  return (
    <section
      className="panel !p-0 flex h-full flex-col overflow-hidden shadow-glow-terracotta"
      style={{ animationDelay: "0ms" }}
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5 sm:px-5">
        <h2 className="flex items-center gap-2 font-display text-base font-bold tracking-wide text-sand-300 sm:text-lg">
          <span>🗺️</span> {resolvedTitle}
        </h2>
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-stone-500">
          {headerNote && (
            <>
              <span className="flex items-center gap-1.5 normal-case text-turquoise-400">
                {headerNote}
              </span>
              <span className="text-stone-700">·</span>
            </>
          )}
          <span className="flex items-center gap-1.5">
            {isNight ? dict.dashboard.island.night : dict.dashboard.island.day}
          </span>
          <span className="text-stone-700">·</span>
          <span className="flex items-center gap-1.5">
            {isRainy
              ? dict.dashboard.island.rainy
              : isCloudy
                ? dict.dashboard.island.cloudy
                : isNight
                  ? dict.dashboard.island.clear
                  : dict.dashboard.island.sunny}
          </span>
          <span className="text-stone-700">·</span>
          <span>{dict.dashboard.island.builtCount(builtCount, 4)}</span>
        </div>
      </div>

      {/* Himmel/Meer: dekorativer Streifen -------------------------------------------------- */}
      <div
        className={`relative h-12 shrink-0 overflow-hidden bg-gradient-to-b transition-colors duration-1000 sm:h-16 ${
          isNight
            ? "from-[#070f14] via-[#0d1a20] to-[#152621]"
            : "from-[#1c343a] via-[#28453f] to-[#3c5a44]"
        }`}
      >
        {isNight ? (
          <>
            {isClearSky &&
              NIGHT_STARS.map((star, i) => (
                <span
                  key={i}
                  className="absolute h-1 w-1 animate-pulse rounded-full bg-white/80"
                  style={{ top: star.top, left: star.left, animationDelay: star.delay }}
                />
              ))}
            {/* Wolken/Regen verdecken den Mond nachts, statt ihn komplett verschwinden zu lassen. */}
            <div
              className={`absolute right-6 top-2 h-5 w-5 rounded-full bg-gradient-to-br from-stone-100 to-stone-400 shadow-[0_0_20px_rgba(255,255,255,0.35)] sm:right-10 sm:h-7 sm:w-7 ${
                isClearSky ? "opacity-90" : "opacity-25"
              }`}
            />
          </>
        ) : (
          // Sonne ist ausschliesslich bei klarem Taghimmel sichtbar - bei Wolken
          // oder Regen bleibt sie auch tagsueber verdeckt.
          isClearSky && (
            <div className="absolute right-6 top-2 h-6 w-6 rounded-full bg-gradient-to-br from-sand-300 to-terracotta-400 opacity-80 blur-[1px] sm:right-10 sm:h-8 sm:w-8" />
          )
        )}

        {(isCloudy || isRainy) && (
          <div className="absolute inset-x-0 top-1 flex items-start justify-around px-2 opacity-70">
            {CLOUDS.map((cloud, i) => (
              <span
                key={i}
                className="h-3 w-8 rounded-full bg-stone-200/70 blur-[2px] sm:h-4 sm:w-11"
                style={{ marginTop: cloud.top, marginLeft: cloud.left }}
              />
            ))}
          </div>
        )}

        <div
          className={`absolute inset-x-0 bottom-1 flex items-end justify-around px-6 ${
            isNight ? "opacity-15" : "opacity-25"
          }`}
        >
          <span className="text-lg sm:text-2xl">🏛️</span>
          <span className="hidden text-base sm:inline sm:text-xl">🗿</span>
          <span className="text-lg sm:text-2xl">🏛️</span>
        </div>

        {isRainy && (
          <div className="absolute inset-0">
            {RAINDROPS.map((drop, i) => (
              <span
                key={i}
                className="absolute top-0 h-4 w-px animate-rain-fall bg-turquoise-100/60"
                style={{ left: drop.left, animationDelay: drop.delay }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Die Karte: Hauptspielflaeche - hier laufen, sammeln, bauen -------------------------------------------------- */}
      <div
        onClick={clickable ? handleGroundClick : undefined}
        className={`relative min-h-[260px] flex-1 overflow-hidden bg-gradient-to-b from-sand-600/25 via-sand-700/15 to-malta-800/40 transition-shadow ${
          placementMode
            ? "cursor-crosshair ring-4 ring-inset ring-turquoise-400/50"
            : clickable
              ? "cursor-pointer"
              : locked && residentInteractive
                ? "cursor-not-allowed"
                : ""
        }`}
        title={
          placementMode
            ? dict.dashboard.island.placeHint
            : clickable
              ? dict.dashboard.island.walkHint
              : locked && residentInteractive
                ? dict.dashboard.island.lockedHint
                : undefined
        }
      >
        <div
          className="absolute inset-0 animate-shimmer opacity-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(100deg, transparent 0, transparent 16px, rgba(255,255,255,0.5) 16px, rgba(255,255,255,0.5) 18px)",
          }}
        />

        {MAP_DECOR.map((d, i) => (
          <span
            key={i}
            className="absolute text-base opacity-40 sm:text-lg"
            style={{ left: d.left, top: d.top }}
          >
            {d.icon}
          </span>
        ))}

        {state.pathTiles.map((tile, i) => (
          <PathTileMark key={i} x={tile.x} y={tile.y} />
        ))}

        {state.regions.map((region) => {
          const nearby = isNearPosition(residentPosition, region, region.radius);
          return (
            <RegionBackground
              key={`${region.type}-bg`}
              region={region}
              style={REGION_STYLE[region.type]}
              entered={nearby}
            />
          );
        })}
        {state.regions.map((region) => {
          const actionType = REGION_ACTION[region.type];
          const resourceField = RESOURCE_FIELD[REGION_RESOURCE[region.type]];
          const nearby = isNearPosition(residentPosition, region, region.radius);
          return (
            <MapStation
              key={region.type}
              icon={REGION_ICON[region.type]}
              label={dict.dashboard.island.regionLabel[region.type]}
              position={region}
              count={state[resourceField]}
              active={activeType === actionType}
              nearby={nearby}
              ambientClass={
                region.type === "sea" ? "animate-float-sm" : region.type === "grove" ? "animate-sway" : ""
              }
              onClick={stationHandler(actionType)}
            />
          );
        })}

        {state.hasFireplace && (
          <MapStation
            icon="🔥"
            label={dict.dashboard.island.fireplace}
            position={fireplacePos}
            built
            justBuilt={fireplaceJustBuilt}
            active={activeType === "cook_meal"}
            nearby={activeType !== "cook_meal" && isNearPosition(residentPosition, fireplacePos)}
            ambientClass="animate-flicker"
            showSmoke
            showEmbers
            glowColor="bg-terracotta-500/40"
            onClick={stationHandler("cook_meal")}
          />
        )}
        {state.hasGarden && (
          <MapStation
            icon="🌻"
            label={dict.dashboard.island.garden}
            position={gardenPos}
            built
            justBuilt={gardenJustBuilt}
            ambientClass="animate-sway"
            glowColor="bg-lime-400/30"
          />
        )}
        {state.hasStorehouse && (
          <MapStation
            icon="🏺"
            label={dict.dashboard.island.storehouse}
            position={storehousePos}
            built
            justBuilt={storehouseJustBuilt}
            ambientClass="animate-float-sm"
            glowColor="bg-sand-400/30"
          />
        )}
        {state.hasShelter && (
          <MapStation
            icon="🛖"
            label={`${dict.dashboard.island.shelter} Lv.${state.shelterLevel}`}
            position={shelterPos}
            built
            justBuilt={shelterJustBuilt}
            active={activeType === "sleep"}
            nearby={activeType !== "sleep" && isNearPosition(residentPosition, shelterPos)}
            ambientClass="animate-breathe"
            glowColor="bg-sand-400/30"
            onClick={stationHandler("sleep")}
          />
        )}
        {state.hasWell && (
          <MapStation
            icon="⛲"
            label={dict.dashboard.island.well}
            position={wellPos}
            built
            justBuilt={wellJustBuilt}
            ambientClass="animate-float-sm"
            glowColor="bg-cyan-400/30"
          />
        )}

        <Character
          x={residentPosition.x}
          y={residentPosition.y}
          label={residentLabel}
          walking={resident.walking}
          flip={resident.flip}
          durationMs={residentWalkDurationMs}
        />
        {guestPosition && (
          <Character
            x={guestPosition.x}
            y={guestPosition.y}
            label={resolvedGuestLabel}
            walking={guest.walking}
            flip={guest.flip}
            tone="guest"
            durationMs={guestWalkDurationMs}
          />
        )}
      </div>
    </section>
  );
}

function Character({
  x,
  y,
  label,
  walking,
  flip,
  tone = "resident",
  durationMs = 1400,
}: {
  x: number;
  y: number;
  label?: string;
  walking: boolean;
  flip: boolean;
  tone?: "resident" | "guest";
  durationMs?: number;
}) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-full transition-all ease-linear"
      style={{ left: `${x}%`, top: `${y}%`, transitionDuration: `${durationMs}ms` }}
    >
      <div className={`flex flex-col items-center ${walking ? "animate-walk-bob" : ""}`}>
        <span
          className="text-2xl drop-shadow-[0_3px_6px_rgba(0,0,0,0.5)] sm:text-3xl"
          style={{ display: "inline-block", transform: flip ? "scaleX(-1)" : undefined }}
        >
          {tone === "guest" ? "🚶" : "🧍"}
        </span>
        {label && (
          <span
            className={`mt-0.5 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
              tone === "guest"
                ? "bg-turquoise-500/80 text-malta-950"
                : "bg-black/50 text-stone-100"
            }`}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

/** Kleiner, deterministischer Hash aus Gebietstyp + Position - liefert fuer
 * dasselbe Gebiet bei jedem Render denselben Wert (kein Math.random() im
 * Render, sonst React-Hydration-Mismatch zwischen Server- und Client-Markup,
 * siehe RAINDROPS/NIGHT_STARS weiter oben fuer denselben Grund). */
function hashRegion(region: { type: string; x: number; y: number }): number {
  const str = `${region.type}-${region.x}-${region.y}`;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Leitet aus dem Hash eine unregelmaessige Umriss-Form (Polygon) statt eines
 * glatten Kreises ab - jeder Eckpunkt liegt hoechstens 50% vom Mittelpunkt
 * entfernt, die Form bleibt also garantiert innerhalb ihrer eigenen Box (kein
 * Ueberstehen ueber den Kartenrand, anders als bei einer Rotation). Bei
 * jedem Render exakt gleich (siehe hashRegion). */
function organicClipPath(region: { type: string; x: number; y: number }): string {
  const h = hashRegion(region);
  const POINTS = 9;
  const points: string[] = [];
  for (let i = 0; i < POINTS; i++) {
    const angle = (i / POINTS) * 2 * Math.PI;
    const bits = (h >>> (i * 3)) & 0x7;
    // 28%-50% vom Mittelpunkt - deutlich unregelmaessig, nie ueber den Rand
    // der eigenen Box hinaus.
    const r = 28 + (bits / 7) * 22;
    const px = 50 + r * Math.cos(angle);
    const py = 50 + r * Math.sin(angle);
    points.push(`${px.toFixed(1)}% ${py.toFixed(1)}%`);
  }
  return `polygon(${points.join(", ")})`;
}

/** Einzelne Weg-/Strassenkachel - rein dekorativ (kein eigener Klick-Handler,
 * das Bauen/Entfernen laeuft ueber den normalen Bodenklick im Platzierungs-
 * modus, siehe Dashboard.tsx). Etwas kleiner als PATH_GRID_STEP, damit
 * zwischen benachbarten Kacheln eine sichtbare Fuge bleibt. */
function PathTileMark({ x, y }: { x: number; y: number }) {
  const size = PATH_GRID_STEP * 0.7;
  return (
    <div
      className="pointer-events-none absolute rounded-sm bg-stone-400/40 ring-1 ring-stone-200/20"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${size}%`,
        height: `${size}%`,
        transform: "translate(-50%, -50%)",
      }}
    />
  );
}

function RegionBackground({
  region,
  style,
  entered,
}: {
  region: { type: string; x: number; y: number; radius: number };
  style: { fill: string; ring: string; enteredFill: string; enteredRing: string };
  /** Charakter steht gerade innerhalb des Gebiets - klar sichtbar hervorheben,
   * statt sich nur auf die Sidebar-Buttons zu verlassen. */
  entered: boolean;
}) {
  const clipPath = organicClipPath(region);
  return (
    <div
      className={`pointer-events-none absolute border-2 transition-colors duration-300 ${
        entered
          ? `${style.enteredFill} ${style.enteredRing} shadow-glow`
          : `${style.fill} ${style.ring} border-dashed`
      }`}
      style={{
        left: `${region.x}%`,
        top: `${region.y}%`,
        width: `${region.radius * 2}%`,
        height: `${region.radius * 2}%`,
        transform: "translate(-50%, -50%)",
        clipPath,
      }}
    />
  );
}

function MapStation({
  icon,
  label,
  position,
  count,
  built = false,
  active = false,
  /** Charakter steht im Gebiet, die Aktion laeuft aber (noch) nicht - Hinweis,
   * dass jetzt ein Klick das Sammeln startet (spiegelt den "ready"-Ring des
   * passenden Sidebar-Buttons). */
  nearby = false,
  justBuilt = false,
  ambientClass = "",
  showSmoke = false,
  showEmbers = false,
  glowColor,
  onClick,
}: {
  icon: string;
  label: string;
  position: Position;
  count?: number;
  built?: boolean;
  active?: boolean;
  nearby?: boolean;
  justBuilt?: boolean;
  ambientClass?: string;
  showSmoke?: boolean;
  showEmbers?: boolean;
  glowColor?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-2xl px-2.5 py-3 text-center transition-all duration-300 ${
        onClick ? "cursor-pointer hover:scale-105" : ""
      } ${
        active
          ? "bg-turquoise-500/15 shadow-glow ring-2 ring-turquoise-400/50"
          : nearby
            ? "bg-sand-400/15 shadow-glow ring-2 ring-sand-300/60"
            : "bg-black/10 ring-1 ring-white/[0.08] backdrop-blur-[1px]"
      }`}
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
    >
      {active && (
        <span className="absolute -right-1 -top-1 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-turquoise-400" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-turquoise-400" />
        </span>
      )}

      {built && glowColor && (
        <span
          className={`absolute bottom-1 left-1/2 h-8 w-14 -translate-x-1/2 animate-glow-pulse rounded-full blur-xl ${glowColor}`}
        />
      )}

      {showSmoke && (
        <>
          <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 animate-smoke-rise rounded-full bg-stone-300/60" />
          <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 animate-smoke-rise rounded-full bg-stone-300/50 [animation-delay:0.7s]" />
          <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 animate-smoke-rise rounded-full bg-stone-300/40 [animation-delay:1.4s]" />
        </>
      )}

      {showEmbers && (
        <>
          <span className="absolute left-[45%] top-1 h-1 w-1 animate-ember rounded-full bg-terracotta-300 [animation-delay:0.3s]" />
          <span className="absolute left-[55%] top-1 h-1 w-1 animate-ember rounded-full bg-sand-300 [animation-delay:1s]" />
        </>
      )}

      <span
        className={`relative text-2xl sm:text-3xl ${ambientClass} ${
          justBuilt ? "animate-build-in" : ""
        } drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]`}
      >
        {icon}
      </span>
      <span className="max-w-[64px] text-balance break-words text-[10px] font-medium leading-tight text-stone-200 sm:max-w-[84px] sm:text-xs">
        {label}
      </span>
      {count !== undefined && (
        <span className="font-mono text-xs font-bold text-sand-300 sm:text-sm">{count}</span>
      )}
    </div>
  );
}
