"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { db } from "@/lib/db";
import { uuid, formatCurrency } from "@/lib/utils";
import { useExchangeRates } from "@/lib/useExchangeRates";
import { convertCurrency } from "@/lib/exchange-rates";
import { fetchCryptoPrice, fetchStockPrice } from "@/lib/price-feeds";
import { getIcon } from "@/lib/icons";
import { COLOR_BADGE_CLASSES } from "@/constants/colors";
import type { Currency, Asset, PriceSource, SnapshotEntry } from "@/types";
import Button from "@/components/ui/Button";

const STEPS = ["Currency", "Assets", "Snapshot", "Done"];

function detectCurrency(): Currency {
  try {
    const lang = navigator.language ?? "";
    if (lang.startsWith("cs")) return "CZK";
    if (lang === "en-US" || lang.startsWith("en-US")) return "USD";
    return "EUR";
  } catch {
    return "USD";
  }
}

const selectClass =
  "w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat px-3 pr-10 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none";

const smallSelectClass =
  "w-24 appearance-none rounded-lg border border-zinc-700 bg-zinc-800 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat px-3 pr-10 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none";

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none";

interface DraftAsset {
  id: string;
  name: string;
  categoryId: string;
  value: string;
  currency: Currency;
  // Auto-tracking fields
  ticker: string;
  priceSource: PriceSource;
  quantity: string;
  unitPrice: string;
}

const EMPTY_DRAFT = (currency: Currency = "CZK"): DraftAsset => ({
  id: uuid(),
  name: "",
  categoryId: "",
  value: "",
  currency,
  ticker: "",
  priceSource: "manual",
  quantity: "1",
  unitPrice: "",
});

/* ───────────────────────── Progress Bar ───────────────────────── */

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((label, i) => (
        <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
          <div
            className={`h-1.5 w-full rounded-full transition-colors duration-300 ${
              i <= step ? "bg-emerald-500" : "bg-zinc-800"
            }`}
          />
          <span
            className={`text-[10px] font-medium transition-colors duration-300 ${
              i <= step ? "text-emerald-400" : "text-zinc-600"
            }`}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── Step 1: Currency ───────────────────────── */

const CURRENCIES: { code: Currency; symbol: string; label: string }[] = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "\u20ac", label: "Euro" },
  { code: "CZK", symbol: "Kč", label: "Czech Koruna" },
];

function StepCurrency({
  selected,
  onSelect,
}: {
  selected: Currency;
  onSelect: (c: Currency) => void;
}) {
  return (
    <div className="flex w-full max-w-md flex-col items-center">
      <h2 className="text-2xl font-bold text-white sm:text-3xl">
        Choose your currency
      </h2>
      <p className="mt-2 text-sm text-zinc-400">
        This is your display currency. You can change it later.
      </p>

      <div className="mt-10 grid w-full grid-cols-3 gap-3">
        {CURRENCIES.map(({ code, symbol, label }) => (
          <button
            key={code}
            onClick={() => onSelect(code)}
            className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-6 transition-all ${
              selected === code
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
            }`}
          >
            <span
              className={`text-3xl font-bold ${
                selected === code ? "text-emerald-400" : "text-zinc-300"
              }`}
            >
              {symbol}
            </span>
            <span
              className={`text-base font-semibold ${
                selected === code ? "text-white" : "text-zinc-400"
              }`}
            >
              {code}
            </span>
            <span className="text-[11px] text-zinc-500">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── Single Asset Card ───────────────────────── */

function AssetDraftCard({
  draft,
  idx,
  canRemove,
  categories,
  onUpdate,
  onRemove,
}: {
  draft: DraftAsset;
  idx: number;
  canRemove: boolean;
  categories: { id: string; name: string }[];
  onUpdate: (id: string, patch: Partial<DraftAsset>) => void;
  onRemove: (id: string) => void;
}) {
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const tickerDirty = useRef(false);

  const catName =
    categories.find((c) => c.id === draft.categoryId)?.name?.toLowerCase() ?? "";
  const isCrypto = catName === "crypto";
  const isStocks = catName === "stocks";
  const showTicker = isCrypto || isStocks;
  const isAutoFetch = showTicker && draft.priceSource !== "manual";

  // Auto-set priceSource + auto-derive ticker when category changes
  useEffect(() => {
    tickerDirty.current = false;
    if (isCrypto) {
      const ticker = draft.name.trim().toLowerCase();
      onUpdate(draft.id, { priceSource: "coingecko", ticker });
    } else if (isStocks) {
      const ticker = draft.name.trim().toUpperCase();
      onUpdate(draft.id, { priceSource: "yahoo", ticker });
    } else {
      onUpdate(draft.id, { priceSource: "manual", ticker: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.categoryId]);

  // Auto-update ticker when name changes (only if user hasn't manually edited it)
  useEffect(() => {
    if (!showTicker || tickerDirty.current) return;
    const derived = isCrypto
      ? draft.name.trim().toLowerCase()
      : draft.name.trim().toUpperCase();
    if (derived) onUpdate(draft.id, { ticker: derived });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.name]);

  // Auto-fetch price when ticker changes (debounced)
  const fetchPrice = useCallback(async () => {
    if (!draft.ticker.trim()) return;
    setFetchingPrice(true);
    setPriceError(null);

    try {
      let prices: Record<string, number> | null = null;
      if (isCrypto) prices = await fetchCryptoPrice(draft.ticker.trim());
      else if (isStocks) prices = await fetchStockPrice(draft.ticker.trim());

      if (!prices) {
        setPriceError("Price not found. Check the ticker.");
        return;
      }

      const price = prices[draft.currency] ?? prices["USD"];
      if (price != null) {
        const cur = prices[draft.currency] ? draft.currency : "USD" as Currency;
        onUpdate(draft.id, {
          unitPrice: price.toString(),
          currency: cur,
          value: ((Number(draft.quantity) || 1) * price).toString(),
        });
      } else {
        setPriceError("Price not available.");
      }
    } catch {
      setPriceError("Failed to fetch price.");
    } finally {
      setFetchingPrice(false);
    }
  }, [draft.ticker, draft.currency, draft.quantity, draft.id, isCrypto, isStocks, onUpdate]);

  useEffect(() => {
    if (!showTicker || !draft.ticker.trim()) return;
    const timeout = setTimeout(fetchPrice, 800);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.ticker]);

  // Recompute value when quantity or unitPrice changes (auto-fetch mode)
  useEffect(() => {
    if (isAutoFetch && draft.unitPrice) {
      const total = (Number(draft.quantity) || 0) * (Number(draft.unitPrice) || 0);
      if (total > 0) onUpdate(draft.id, { value: total.toString() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.quantity, draft.unitPrice]);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500">
          Asset {idx + 1}
        </span>
        {canRemove && (
          <button
            onClick={() => onRemove(draft.id)}
            className="rounded-lg p-1 text-zinc-600 hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="e.g. Bitcoin, Apartment, Apple stock..."
        value={draft.name}
        onChange={(e) => onUpdate(draft.id, { name: e.target.value })}
        className={inputClass}
      />

      <select
        value={draft.categoryId}
        onChange={(e) => onUpdate(draft.id, { categoryId: e.target.value })}
        className={selectClass}
      >
        <option value="">Select category...</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      {/* Ticker field for Crypto / Stocks */}
      {showTicker && (
        <div>
          <div className="relative">
            <input
              type="text"
              value={draft.ticker}
              onChange={(e) => {
                tickerDirty.current = true;
                onUpdate(draft.id, { ticker: e.target.value });
              }}
              placeholder={
                isCrypto
                  ? "CoinGecko ID (e.g. bitcoin, ethereum)"
                  : "Ticker (e.g. AAPL, TSLA)"
              }
              className={inputClass}
            />
            {fetchingPrice && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-400" />
            )}
          </div>
          {priceError && (
            <p className="mt-1 text-xs text-red-400">{priceError}</p>
          )}
        </div>
      )}

      {/* Auto-fetch: quantity + unit price */}
      {isAutoFetch && draft.ticker.trim() ? (
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Quantity (e.g. 0.5)"
            value={draft.quantity}
            onChange={(e) => onUpdate(draft.id, { quantity: e.target.value })}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
            min="0"
            step="any"
          />
          <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-zinc-400">
            {draft.unitPrice
              ? formatCurrency(Number(draft.unitPrice), draft.currency)
              : "..."}
          </div>
        </div>
      ) : (
        /* Manual value entry */
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="50000"
            value={draft.value}
            onChange={(e) => onUpdate(draft.id, { value: e.target.value })}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
          <select
            value={draft.currency}
            onChange={(e) =>
              onUpdate(draft.id, { currency: e.target.value as Currency })
            }
            className={smallSelectClass}
          >
            <option value="CZK">CZK</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>
      )}

      {/* Show computed total for auto-fetch */}
      {isAutoFetch && draft.unitPrice && Number(draft.value) > 0 && (
        <div className="rounded-lg bg-zinc-800/50 px-3 py-2 text-right">
          <span className="text-xs text-zinc-500">Total: </span>
          <span className="text-sm font-medium text-white">
            {formatCurrency(Number(draft.value), draft.currency)}
          </span>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Step 2: Add Assets ───────────────────────── */

function StepAssets({
  drafts,
  setDrafts,
  currency,
}: {
  drafts: DraftAsset[];
  setDrafts: React.Dispatch<React.SetStateAction<DraftAsset[]>>;
  currency: Currency;
}) {
  const categories = useLiveQuery(() =>
    db.categories.orderBy("sortOrder").toArray()
  );

  const catList = useMemo(
    () => categories?.map((c) => ({ id: c.id, name: c.name })) ?? [],
    [categories]
  );

  const updateDraft = useCallback(
    (id: string, patch: Partial<DraftAsset>) => {
      setDrafts((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...patch } : d))
      );
    },
    [setDrafts]
  );

  function removeDraft(id: string) {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }

  function addAnother() {
    setDrafts((prev) => [...prev, EMPTY_DRAFT(currency)]);
  }

  return (
    <div className="flex w-full max-w-lg flex-col items-center">
      <h2 className="text-2xl font-bold text-white sm:text-3xl">
        Add your first asset
      </h2>
      <p className="mt-2 text-sm text-zinc-400">
        What do you own? You can always add more later.
      </p>

      <div className="mt-8 w-full space-y-4">
        {drafts.map((draft, idx) => (
          <AssetDraftCard
            key={draft.id}
            draft={draft}
            idx={idx}
            canRemove={drafts.length > 1}
            categories={catList}
            onUpdate={updateDraft}
            onRemove={removeDraft}
          />
        ))}
      </div>

      <button
        onClick={addAnother}
        className="mt-4 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/10"
      >
        <Plus className="h-4 w-4" />
        Add another asset
      </button>
    </div>
  );
}

/* ───────────────────────── Step 3: Snapshot ───────────────────────── */

function StepSnapshot({
  drafts,
  currency,
  rates,
  onSave,
  saving,
}: {
  drafts: DraftAsset[];
  currency: Currency;
  rates: Record<string, number>;
  onSave: () => void;
  saving: boolean;
}) {
  const categories = useLiveQuery(() => db.categories.toArray());
  const catMap = new Map(categories?.map((c) => [c.id, c]) ?? []);

  const total = drafts.reduce((sum, d) => {
    const val = parseFloat(d.value) || 0;
    return sum + convertCurrency(val, d.currency, currency, rates);
  }, 0);

  return (
    <div className="flex w-full max-w-lg flex-col items-center">
      <h2 className="text-2xl font-bold text-white sm:text-3xl">
        Take your first snapshot
      </h2>
      <p className="mt-2 max-w-sm text-center text-sm text-zinc-400">
        Snapshots record your portfolio&apos;s value at a point in time. Take
        them regularly to track your progress.
      </p>

      <div className="mt-8 w-full rounded-xl border border-zinc-800 bg-zinc-900/50 divide-y divide-zinc-800">
        {drafts.map((d) => {
          const cat = catMap.get(d.categoryId);
          const Icon = cat ? getIcon(cat.icon) : getIcon("box");
          const badge = cat
            ? COLOR_BADGE_CLASSES[cat.color] ?? COLOR_BADGE_CLASSES.zinc
            : COLOR_BADGE_CLASSES.zinc;

          return (
            <div key={d.id} className="flex items-center gap-3 px-4 py-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${badge}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-white truncate">
                  {d.name}
                </span>
                {d.ticker && (
                  <span className="text-xs text-zinc-500">{d.ticker}</span>
                )}
              </div>
              <span className="text-sm text-zinc-400 shrink-0">
                {formatCurrency(parseFloat(d.value) || 0, d.currency)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-zinc-500">Total net worth</p>
        <p className="mt-1 text-3xl font-bold text-white">
          {formatCurrency(total, currency)}
        </p>
      </div>

      <Button
        onClick={onSave}
        disabled={saving}
        className="mt-8 rounded-full px-8 py-3"
      >
        {saving ? "Saving..." : "Save Snapshot"}
      </Button>
    </div>
  );
}

/* ───────────────────────── Step 4: Done ───────────────────────── */

function StepDone({
  totalNetWorth,
  currency,
  onFinish,
}: {
  totalNetWorth: number;
  currency: Currency;
  onFinish: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
        <CheckCircle className="h-10 w-10 text-emerald-500" />
      </div>

      <h2 className="mt-6 text-2xl font-bold text-white sm:text-3xl">
        You&apos;re all set!
      </h2>

      <p className="mt-4 text-sm text-zinc-500">Your net worth</p>
      <p className="mt-1 text-4xl font-bold text-white">
        {formatCurrency(totalNetWorth, currency)}
      </p>

      <p className="mx-auto mt-6 max-w-xs text-sm text-zinc-400">
        Your data is stored locally. No one else can see it.
      </p>

      <button
        onClick={onFinish}
        className="group mt-10 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/30 active:scale-[0.98]"
      >
        Go to Dashboard
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}

/* ───────────────────────── Wizard ───────────────────────── */

export default function OnboardingWizard({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [step, setStep] = useState(0);
  const [currency, setCurrency] = useState<Currency>(detectCurrency);
  const [drafts, setDrafts] = useState<DraftAsset[]>([EMPTY_DRAFT()]);
  const [saving, setSaving] = useState(false);
  const [totalNetWorth, setTotalNetWorth] = useState(0);

  const { rates } = useExchangeRates();

  const validDrafts = drafts.filter(
    (d) => d.name.trim() && d.categoryId && parseFloat(d.value) > 0
  );
  const canAdvance =
    step === 0 ||
    (step === 1 && validDrafts.length > 0) ||
    step === 2 ||
    step === 3;

  async function saveAll() {
    setSaving(true);
    const now = new Date();

    // Update primary currency
    await db.settings.update("settings", { primaryCurrency: currency });

    // Create assets
    const assets: Asset[] = validDrafts.map((d) => {
      const isAutoFetch = d.priceSource !== "manual" && d.ticker.trim();
      return {
        id: uuid(),
        name: d.name.trim(),
        categoryId: d.categoryId,
        currency: d.currency,
        currentValue: parseFloat(d.value),
        priceSource: d.priceSource,
        ticker: d.ticker.trim() || undefined,
        quantity: isAutoFetch ? (Number(d.quantity) || 1) : undefined,
        unitPrice: isAutoFetch ? (Number(d.unitPrice) || 0) : undefined,
        lastPriceUpdate: isAutoFetch ? now : undefined,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      };
    });

    await db.assets.bulkAdd(assets);

    // Create snapshot
    const entries: SnapshotEntry[] = assets.map((a) => ({
      assetId: a.id,
      assetName: a.name,
      categoryId: a.categoryId,
      value: a.currentValue,
      currency: a.currency,
    }));

    const total = assets.reduce(
      (sum, a) =>
        sum + convertCurrency(a.currentValue, a.currency, currency, rates),
      0
    );

    await db.snapshots.add({
      id: uuid(),
      date: now,
      entries,
      totalNetWorth: total,
      primaryCurrency: currency,
      createdAt: now,
    });

    // Update last snapshot date for auto-snapshot tracking
    await db.settings.update("settings", { lastSnapshotDate: now });

    setTotalNetWorth(total);
    setSaving(false);
    setStep(3);
  }

  function next() {
    if (step === 2) {
      saveAll();
    } else if (step === 3) {
      onComplete();
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#09090b]">
      {/* Progress bar */}
      <div className="shrink-0 px-6 pt-6 pb-4 sm:px-10">
        <ProgressBar step={step} />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 pb-32">
        {step === 0 && (
          <StepCurrency selected={currency} onSelect={setCurrency} />
        )}
        {step === 1 && (
          <StepAssets
            drafts={drafts}
            setDrafts={setDrafts}
            currency={currency}
          />
        )}
        {step === 2 && (
          <StepSnapshot
            drafts={validDrafts}
            currency={currency}
            rates={rates}
            onSave={saveAll}
            saving={saving}
          />
        )}
        {step === 3 && (
          <StepDone
            totalNetWorth={totalNetWorth}
            currency={currency}
            onFinish={onComplete}
          />
        )}
      </div>

      {/* Navigation buttons */}
      {step < 3 && (
        <div className="fixed bottom-0 inset-x-0 border-t border-zinc-800/60 bg-[#09090b]/90 px-6 py-4 backdrop-blur-sm">
          <div className="mx-auto flex max-w-lg items-center justify-between">
            <button
              onClick={() => setStep((s) => s - 1)}
              className={`flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white ${
                step === 0 ? "invisible" : ""
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            {step === 2 ? (
              <Button
                onClick={saveAll}
                disabled={saving}
                className="rounded-full px-6"
              >
                {saving ? "Saving..." : "Save Snapshot"}
              </Button>
            ) : (
              <button
                onClick={next}
                disabled={!canAdvance}
                className="group flex items-center gap-1.5 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600"
              >
                Continue
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
