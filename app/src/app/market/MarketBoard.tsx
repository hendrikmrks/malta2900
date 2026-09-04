"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  RESOURCE_TYPES,
  RESOURCE_ICON,
  TRADABLE_RESOURCE_TYPES,
  effectiveMerchantSellPrice,
  effectiveMerchantBuyPrice,
  type ResourceType,
} from "@/lib/game";
import { useDict, useLocale } from "@/lib/i18n/LocaleProvider";
import { translateApiError } from "@/lib/i18n/errors";
import { useToast } from "@/components/Toast";
import { apiFetch } from "@/lib/apiFetch";

type Offer = {
  id: string;
  sellerUsername: string;
  isOwn: boolean;
  offerResource: ResourceType;
  offerAmount: number;
  requestResource: ResourceType;
  requestAmount: number;
};

type Inventory = Record<ResourceType, number>;
type Currency = { sellMultiplier: number; buyMultiplier: number };

const POLL_INTERVAL_MS = 10_000;

export default function MarketBoard({
  initialInventory,
  initialCurrency,
  initialOffers,
}: {
  initialInventory: Inventory;
  initialCurrency: Currency;
  initialOffers: Offer[];
}) {
  const dict = useDict();
  const locale = useLocale();
  const toast = useToast();
  const [inventory, setInventory] = useState<Inventory>(initialInventory);
  const [currency, setCurrency] = useState<Currency>(initialCurrency);
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [offerResource, setOfferResource] = useState<ResourceType>("wood");
  const [offerAmount, setOfferAmount] = useState(5);
  const [requestResource, setRequestResource] = useState<ResourceType>("water");
  const [requestAmount, setRequestAmount] = useState(5);
  const [busy, setBusy] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const resourceLabel: Record<ResourceType, string> = dict.resources;

  const refresh = useCallback(async () => {
    try {
      const [offersRes, stateRes] = await Promise.all([
        apiFetch("/api/market/offers", { cache: "no-store" }),
        apiFetch("/api/state", { cache: "no-store" }),
      ]);
      if (offersRes.ok) setOffers(await offersRes.json());
      if (stateRes.ok) {
        const s = await stateRes.json();
        setInventory({
          fig: s.figCount,
          wood: s.woodCount,
          water: s.waterCount,
          vegetable: s.vegetableCount,
          fish: s.fishCount,
          stone: s.stoneCount,
          coin: s.coinCount,
        });
        setCurrency({
          sellMultiplier: s.currencySellMultiplier,
          buyMultiplier: s.currencyBuyMultiplier,
        });
      }
    } catch {
      // Nächster Poll versucht es erneut.
    }
  }, []);

  useEffect(() => {
    // Sofort aktualisieren statt erst nach dem ersten Intervall - sonst zeigt
    // die Seite nach einer Client-Navigation (z.B. von der Insel hierher)
    // bis zu POLL_INTERVAL_MS lang noch den alten Stand.
    refresh();
    pollTimer.current = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [refresh]);

  async function createOffer(e: React.FormEvent) {
    e.preventDefault();
    if (offerResource === requestResource) {
      toast.push("error", dict.market.mustDifferError);
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch("/api/market/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerResource, offerAmount, requestResource, requestAmount }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.push("error", translateApiError(dict, data, locale));
      } else {
        toast.push("success", dict.market.offerCreatedToast);
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function acceptOffer(id: string) {
    setBusy(true);
    try {
      const res = await apiFetch(`/api/market/offers/${id}/accept`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.push("error", translateApiError(dict, data, locale));
      } else {
        toast.push("success", dict.market.tradeCompletedToast);
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function merchantSell(resource: Exclude<ResourceType, "coin">) {
    setBusy(true);
    try {
      const res = await apiFetch("/api/market/merchant/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource, amount: 1 }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.push("error", translateApiError(dict, data, locale));
      } else {
        toast.push("success", dict.market.merchantSoldToast);
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function merchantBuy(resource: Exclude<ResourceType, "coin">) {
    setBusy(true);
    try {
      const res = await apiFetch("/api/market/merchant/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource, amount: 1 }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.push("error", translateApiError(dict, data, locale));
      } else {
        toast.push("success", dict.market.merchantBoughtToast);
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function cancelOffer(id: string) {
    setBusy(true);
    try {
      const res = await apiFetch(`/api/market/offers/${id}/cancel`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.push("error", translateApiError(dict, data, locale));
      } else {
        toast.push("success", dict.market.offerWithdrawnToast);
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const ownOffers = offers.filter((o) => o.isOwn);
  const otherOffers = offers.filter((o) => !o.isOwn);

  // Sichtbarer Hinweis auf die aktive Geldpolitik der Bank - die reinen
  // Zahlen aendern sich sonst unbemerkt im Hintergrund.
  const economyStatus =
    currency.buyMultiplier > 1.08
      ? { icon: "📈", text: dict.market.economyInflation }
      : currency.buyMultiplier < 0.92
        ? { icon: "📉", text: dict.market.economyDeflation }
        : { icon: "⚖️", text: dict.market.economyStable };

  return (
    <div className="space-y-6">
      <section className="panel">
        <div className="panel-header flex-wrap justify-between gap-x-4 gap-y-1">
          <span className="flex items-center gap-2.5">
            <span>🏪</span>
            <span>{dict.market.merchantTitle}</span>
          </span>
          <span className="flex items-center gap-1.5 normal-case text-stone-400">
            <span>{economyStatus.icon}</span>
            <span>{economyStatus.text}</span>
          </span>
        </div>
        <p className="mb-4 text-sm text-stone-400">{dict.market.merchantIntro}</p>
        <div className="mb-3 flex items-center gap-2 text-sm">
          <span className="text-lg">🪙</span>
          <span className="font-mono font-bold tabular-nums text-yellow-300">{inventory.coin}</span>
          <span className="text-stone-400">{dict.resources.coin}</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TRADABLE_RESOURCE_TYPES.map((resource) => (
            <MerchantRow
              key={resource}
              resource={resource}
              label={resourceLabel[resource]}
              have={inventory[resource]}
              coins={inventory.coin}
              currency={currency}
              busy={busy}
              onSell={() => merchantSell(resource)}
              onBuy={() => merchantBuy(resource)}
              sellLabel={dict.market.merchantSellButton}
              buyLabel={dict.market.merchantBuyButton}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <section className="panel lg:sticky lg:top-6 lg:self-start">
        <div className="panel-header">
          <span>➕</span>
          <span>{dict.market.createOfferTitle}</span>
        </div>
        <p className="mb-4 text-sm text-stone-400">{dict.market.createOfferIntro}</p>
        <form onSubmit={createOffer} className="space-y-4">
          <ResourcePicker
            label={dict.market.youGive}
            resource={offerResource}
            amount={offerAmount}
            onResourceChange={setOfferResource}
            onAmountChange={setOfferAmount}
            available={inventory[offerResource]}
            resourceLabel={resourceLabel}
            haveCurrently={dict.market.haveCurrently}
          />
          <div className="text-center text-stone-500">⇅</div>
          <ResourcePicker
            label={dict.market.youGet}
            resource={requestResource}
            amount={requestAmount}
            onResourceChange={setRequestResource}
            onAmountChange={setRequestAmount}
            resourceLabel={resourceLabel}
            haveCurrently={dict.market.haveCurrently}
          />

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {dict.market.submitOffer}
          </button>
        </form>

        {ownOffers.length > 0 && (
          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="panel-header">
              <span>📌</span>
              <span>
                {dict.market.myOffersTitle} ({ownOffers.length})
              </span>
            </div>
            <div className="space-y-2">
              {ownOffers.map((o) => (
                <div key={o.id} className="inventory-tile !flex-col !items-stretch !gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <ResourceChip
                      icon={RESOURCE_ICON[o.offerResource]}
                      amount={o.offerAmount}
                      label={resourceLabel[o.offerResource]}
                    />
                    <span className="text-stone-500">→</span>
                    <ResourceChip
                      icon={RESOURCE_ICON[o.requestResource]}
                      amount={o.requestAmount}
                      label={resourceLabel[o.requestResource]}
                    />
                  </div>
                  <button
                    className="btn-ghost self-end !px-2.5 !py-1 text-xs"
                    disabled={busy}
                    onClick={() => cancelOffer(o.id)}
                  >
                    {dict.market.withdraw}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <span>🛒</span>
          <span>{dict.market.openOffersTitle}</span>
        </div>
        <p className="mb-4 text-sm text-stone-400">{dict.market.openOffersIntro}</p>
        {otherOffers.length === 0 ? (
          <p className="text-sm text-stone-400">{dict.market.noOpenOffers}</p>
        ) : (
          <div className="space-y-2">
            {otherOffers.map((o) => {
              const canAfford = inventory[o.requestResource] >= o.requestAmount;
              return (
                <div
                  key={o.id}
                  className="inventory-tile !flex-col !items-stretch !gap-2 sm:!flex-row sm:!items-center sm:!justify-between"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="shrink-0 text-xs font-semibold text-sand-300">
                      {o.sellerUsername}
                    </span>
                    <ResourceChip
                      icon={RESOURCE_ICON[o.offerResource]}
                      amount={o.offerAmount}
                      label={resourceLabel[o.offerResource]}
                    />
                    <span className="text-stone-500">{dict.market.forConnector}</span>
                    <ResourceChip
                      icon={RESOURCE_ICON[o.requestResource]}
                      amount={o.requestAmount}
                      label={resourceLabel[o.requestResource]}
                    />
                  </div>
                  <button
                    className="btn-primary shrink-0 self-end !px-3 !py-1.5 text-xs sm:self-auto"
                    disabled={busy || !canAfford}
                    onClick={() => acceptOffer(o.id)}
                  >
                    {canAfford ? dict.market.tradeButton : dict.market.notEnoughStock}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
      </div>
    </div>
  );
}

function MerchantRow({
  resource,
  label,
  have,
  coins,
  currency,
  busy,
  onSell,
  onBuy,
  sellLabel,
  buyLabel,
}: {
  resource: Exclude<ResourceType, "coin">;
  label: string;
  have: number;
  coins: number;
  currency: Currency;
  busy: boolean;
  onSell: () => void;
  onBuy: () => void;
  sellLabel: (price: number) => string;
  buyLabel: (price: number) => string;
}) {
  // Live nach den aktuellen Bank-Multiplikatoren berechnet - dieselbe Formel
  // wie serverseitig beim tatsaechlichen Kauf/Verkauf (siehe lib/game.ts),
  // damit hier immer genau das steht, was der Server auch abrechnet.
  const sellPrice = effectiveMerchantSellPrice(resource, currency.sellMultiplier);
  const buyPrice = effectiveMerchantBuyPrice(resource, currency.buyMultiplier, sellPrice);
  return (
    <div className="inventory-tile !flex-col !items-stretch !gap-2">
      <span className="flex items-center gap-2 text-sm text-stone-300">
        <span className="text-lg">{RESOURCE_ICON[resource]}</span>
        {label}
        <span className="ml-auto font-mono text-xs tabular-nums text-stone-500">{have}</span>
      </span>
      <div className="flex gap-1.5">
        <button
          className="btn-ghost flex-1 !px-2 !py-1 text-[11px]"
          disabled={busy || have < 1}
          onClick={onSell}
        >
          {sellLabel(sellPrice)}
        </button>
        <button
          className="btn-ghost flex-1 !px-2 !py-1 text-[11px]"
          disabled={busy || coins < buyPrice}
          onClick={onBuy}
        >
          {buyLabel(buyPrice)}
        </button>
      </div>
    </div>
  );
}

function ResourcePicker({
  label,
  resource,
  amount,
  onResourceChange,
  onAmountChange,
  available,
  resourceLabel,
  haveCurrently,
}: {
  label: string;
  resource: ResourceType;
  amount: number;
  onResourceChange: (r: ResourceType) => void;
  onAmountChange: (n: number) => void;
  available?: number;
  resourceLabel: Record<ResourceType, string>;
  haveCurrently: (amount: number) => string;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="flex gap-2">
        <input
          type="number"
          min={1}
          className="input-field w-20 shrink-0"
          value={amount}
          onChange={(e) => onAmountChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
        />
        <select
          className="input-field"
          value={resource}
          onChange={(e) => onResourceChange(e.target.value as ResourceType)}
        >
          {RESOURCE_TYPES.map((r) => (
            <option key={r} value={r}>
              {RESOURCE_ICON[r]} {resourceLabel[r]}
            </option>
          ))}
        </select>
      </div>
      {available !== undefined && <p className="mt-1 text-xs text-stone-500">{haveCurrently(available)}</p>}
    </div>
  );
}

/** Kompaktes "5 🌿 Feigen"-Badge statt einer ausformulierten Zeile - macht
 * Angebote auf einen Blick scannbar. */
function ResourceChip({ icon, amount, label }: { icon: string; amount: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2 py-1 text-xs whitespace-nowrap">
      <span className="text-sm">{icon}</span>
      <span className="font-mono font-semibold tabular-nums text-stone-100">{amount}</span>
      <span className="text-stone-400">{label}</span>
    </span>
  );
}
