"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TRADABLE_RESOURCE_TYPES,
  RESOURCE_ICON,
  MERCHANT_SELL_PRICE,
  MERCHANT_BUY_PRICE,
  effectiveMerchantSellPrice,
  effectiveMerchantBuyPrice,
  type ResourceType,
} from "@/lib/game";
import { useDict, useLocale } from "@/lib/i18n/LocaleProvider";
import { apiFetch } from "@/lib/apiFetch";

type Snapshot = { at: string; sellMultiplier: number; buyMultiplier: number };

const POLL_INTERVAL_MS = 60_000;

// Validierte kategoriale Zwei-Farben-Palette (dataviz-Skill, dark mode, gegen
// den tatsaechlichen App-Hintergrund #0a1315 geprueft) - die App-eigenen
// Akzentfarben (terracotta/turquoise) fallen beim Lightness-/Chroma-Check
// durch, siehe Begruendung im Chat. Fixe Reihenfolge: Verkauf zuerst.
const SELL_COLOR = "#3987e5";
const BUY_COLOR = "#d95926";
const SURFACE_COLOR = "#15262a"; // trifft app malta-800, der Panel-Hintergrund

export default function EconomyBoard({ initialSnapshots }: { initialSnapshots: Snapshot[] }) {
  const dict = useDict();
  const locale = useLocale();
  const [snapshots, setSnapshots] = useState<Snapshot[]>(initialSnapshots);
  const [view, setView] = useState<"chart" | "table">("chart");
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await apiFetch("/api/economy/history", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data.snapshots);
      }
    } catch {
      // Naechster Poll versucht es erneut.
    }
  }, []);

  useEffect(() => {
    refresh();
    pollTimer.current = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [refresh]);

  const resourceLabel: Record<ResourceType, string> = dict.resources;

  // Pro Rohstoff aus den zwei rohen Multiplikatoren die tatsaechlichen
  // Preise ableiten - dieselbe Formel wie Server und Marktplatz.
  const seriesByResource = useMemo(() => {
    const result: Record<string, { atMs: number; sell: number; buy: number }[]> = {};
    for (const resource of TRADABLE_RESOURCE_TYPES) {
      result[resource] = snapshots.map((s) => {
        const sell = effectiveMerchantSellPrice(resource, s.sellMultiplier);
        return {
          atMs: new Date(s.at).getTime(),
          sell,
          buy: effectiveMerchantBuyPrice(resource, s.buyMultiplier, sell),
        };
      });
    }
    return result;
  }, [snapshots]);

  const hasEnoughData = snapshots.length >= 2;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        {hasEnoughData && (
          <div className="flex items-center gap-3 text-xs text-stone-400">
            <LegendSwatch color={SELL_COLOR} label={dict.economy.sellSeriesLabel} />
            <LegendSwatch color={BUY_COLOR} label={dict.economy.buySeriesLabel} />
          </div>
        )}
        <div className="ml-auto flex gap-1.5">
          <button
            className={`btn-ghost !px-3 !py-1.5 text-xs ${view === "chart" ? "!ring-2 !ring-turquoise-400/50" : ""}`}
            onClick={() => setView("chart")}
          >
            {dict.economy.viewChart}
          </button>
          <button
            className={`btn-ghost !px-3 !py-1.5 text-xs ${view === "table" ? "!ring-2 !ring-turquoise-400/50" : ""}`}
            onClick={() => setView("table")}
          >
            {dict.economy.viewTable}
          </button>
        </div>
      </div>

      {!hasEnoughData ? (
        <div className="panel text-sm text-stone-400">{dict.economy.noDataYet}</div>
      ) : view === "chart" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TRADABLE_RESOURCE_TYPES.map((resource) => (
            <ResourceLineChart
              key={resource}
              icon={RESOURCE_ICON[resource]}
              label={resourceLabel[resource]}
              points={seriesByResource[resource]}
              sellLabel={dict.economy.sellSeriesLabel}
              buyLabel={dict.economy.buySeriesLabel}
              locale={locale}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <section className="panel overflow-x-auto">
            <div className="panel-header">
              <span>📋</span>
              <span>{dict.economy.viewTable}</span>
            </div>
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-stone-500">
                  <th className="pb-2 pr-4 font-semibold">{dict.economy.tableTimeHeader}</th>
                  <th className="pb-2 pr-4 font-semibold">{dict.economy.tableSellHeader}</th>
                  <th className="pb-2 font-semibold">{dict.economy.tableBuyHeader}</th>
                </tr>
              </thead>
              <tbody>
                {[...snapshots].reverse().map((s) => (
                  <tr key={s.at} className="border-t border-white/[0.06] text-stone-300">
                    <td className="py-1.5 pr-4 font-mono text-xs tabular-nums text-stone-400">
                      {new Date(s.at).toLocaleString(locale)}
                    </td>
                    <td className="py-1.5 pr-4 font-mono tabular-nums">{s.sellMultiplier.toFixed(2)}×</td>
                    <td className="py-1.5 font-mono tabular-nums">{s.buyMultiplier.toFixed(2)}×</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="panel overflow-x-auto">
            <div className="panel-header">
              <span>💰</span>
              <span>{dict.economy.basePriceTitle}</span>
            </div>
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-stone-500">
                  <th className="pb-2 pr-4 font-semibold">{dict.economy.basePriceResourceHeader}</th>
                  <th className="pb-2 pr-4 font-semibold">{dict.economy.basePriceSellHeader}</th>
                  <th className="pb-2 font-semibold">{dict.economy.basePriceBuyHeader}</th>
                </tr>
              </thead>
              <tbody>
                {TRADABLE_RESOURCE_TYPES.map((resource) => (
                  <tr key={resource} className="border-t border-white/[0.06] text-stone-300">
                    <td className="py-1.5 pr-4">
                      {RESOURCE_ICON[resource]} {resourceLabel[resource]}
                    </td>
                    <td className="py-1.5 pr-4 font-mono tabular-nums">
                      {MERCHANT_SELL_PRICE[resource]} 🪙
                    </td>
                    <td className="py-1.5 font-mono tabular-nums">{MERCHANT_BUY_PRICE[resource]} 🪙</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </span>
  );
}

const CHART_WIDTH = 300;
const CHART_HEIGHT = 140;
const PAD_LEFT = 30;
const PAD_RIGHT = 12;
const PAD_TOP = 14;
const PAD_BOTTOM = 10;

function ResourceLineChart({
  icon,
  label,
  points,
  sellLabel,
  buyLabel,
  locale,
}: {
  icon: string;
  label: string;
  points: { atMs: number; sell: number; buy: number }[];
  sellLabel: string;
  buyLabel: string;
  locale: string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const { xScale, yScale, yTicks } = useMemo(() => {
    const minX = points[0].atMs;
    const maxX = points[points.length - 1].atMs;
    const values = points.flatMap((p) => [p.sell, p.buy]);
    const minVRaw = Math.min(...values);
    const maxVRaw = Math.max(...values);
    const span = Math.max(1, maxVRaw - minVRaw);
    const minV = Math.max(0, minVRaw - span * 0.15);
    const maxV = maxVRaw + span * 0.15;

    const xScaleFn = (x: number) =>
      maxX === minX
        ? PAD_LEFT
        : PAD_LEFT + ((x - minX) / (maxX - minX)) * (CHART_WIDTH - PAD_LEFT - PAD_RIGHT);
    const yScaleFn = (v: number) =>
      CHART_HEIGHT -
      PAD_BOTTOM -
      ((v - minV) / (maxV - minV)) * (CHART_HEIGHT - PAD_TOP - PAD_BOTTOM);

    const ticks = [minV, (minV + maxV) / 2, maxV];
    return { xScale: xScaleFn, yScale: yScaleFn, yTicks: ticks };
  }, [points]);

  const sellPath = points.map((p) => `${xScale(p.atMs)},${yScale(p.sell)}`).join(" L ");
  const buyPath = points.map((p) => `${xScale(p.atMs)},${yScale(p.buy)}`).join(" L ");
  const last = points[points.length - 1];
  const first = points[0];

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * CHART_WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(xScale(p.atMs) - px);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="panel !p-3.5">
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-sand-300">
          <span>{icon}</span> {label}
        </span>
        <span className="font-mono text-xs tabular-nums text-stone-400">
          {last.sell}🪙 / {last.buy}🪙
        </span>
      </div>
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full"
          style={{ height: `${CHART_HEIGHT}px` }}
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {yTicks.map((t, i) => (
            <line
              key={i}
              x1={PAD_LEFT}
              x2={CHART_WIDTH - PAD_RIGHT}
              y1={yScale(t)}
              y2={yScale(t)}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
            />
          ))}
          {yTicks.map((t, i) => (
            <text key={i} x={PAD_LEFT - 6} y={yScale(t) + 3} textAnchor="end" className="fill-stone-500" fontSize={8}>
              {Math.round(t)}
            </text>
          ))}

          <polyline points={sellPath} fill="none" stroke={SELL_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <polyline points={buyPath} fill="none" stroke={BUY_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          <circle cx={xScale(last.atMs)} cy={yScale(last.sell)} r={4} fill={SELL_COLOR} stroke={SURFACE_COLOR} strokeWidth={2} />
          <circle cx={xScale(last.atMs)} cy={yScale(last.buy)} r={4} fill={BUY_COLOR} stroke={SURFACE_COLOR} strokeWidth={2} />

          {hovered && (
            <>
              <line
                x1={xScale(hovered.atMs)}
                x2={xScale(hovered.atMs)}
                y1={PAD_TOP}
                y2={CHART_HEIGHT - PAD_BOTTOM}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={1}
              />
              <circle cx={xScale(hovered.atMs)} cy={yScale(hovered.sell)} r={4} fill={SELL_COLOR} stroke={SURFACE_COLOR} strokeWidth={2} />
              <circle cx={xScale(hovered.atMs)} cy={yScale(hovered.buy)} r={4} fill={BUY_COLOR} stroke={SURFACE_COLOR} strokeWidth={2} />
            </>
          )}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-white/10 bg-malta-950/95 px-2.5 py-1.5 text-[11px] shadow-lg"
            style={{
              left: `${(xScale(hovered.atMs) / CHART_WIDTH) * 100}%`,
            }}
          >
            <p className="mb-1 whitespace-nowrap text-stone-400">
              {new Date(hovered.atMs).toLocaleString(locale, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="flex items-center gap-1.5 whitespace-nowrap text-stone-400">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: SELL_COLOR }} />
              {sellLabel}: <span className="text-stone-200">{hovered.sell}🪙</span>
            </p>
            <p className="flex items-center gap-1.5 whitespace-nowrap text-stone-400">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BUY_COLOR }} />
              {buyLabel}: <span className="text-stone-200">{hovered.buy}🪙</span>
            </p>
          </div>
        )}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-stone-500">
        <span>{new Date(first.atMs).toLocaleDateString(locale)}</span>
        <span>{new Date(last.atMs).toLocaleDateString(locale)}</span>
      </div>
    </div>
  );
}
