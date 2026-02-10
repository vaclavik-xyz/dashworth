"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowLeft,
  ArrowRight,
  X,
  Bitcoin,
  TrendingUp,
  Banknote,
  Box,
} from "lucide-react";
import { db } from "@/lib/db";
import { uuid, formatCurrency } from "@/lib/utils";
import { useExchangeRates } from "@/lib/useExchangeRates";
import { convertCurrency } from "@/lib/exchange-rates";
import TickerInput, { type TickerResult } from "@/components/shared/TickerInput";
import QuantityValueToggle from "@/components/shared/QuantityValueToggle";
import { getIcon } from "@/lib/icons";
import { COLOR_BADGE_CLASSES } from "@/constants/colors";
import type { Currency, Asset, PriceSource } from "@/types";
import Button from "@/components/ui/Button";
import PriceSourceBadge from "@/components/ui/PriceSourceBadge";

const STEPS = ["Currency", "Assets", "Review"];

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

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none";

interface DraftAsset {
  id: string;
  name: string;
  symbol: string; // Display symbol — "BTC" for crypto, "MSFT" for stocks, "" for manual
  categoryId: string;
  value: string;
  currency: Currency;
  ticker: string;
  priceSource: PriceSource;
  quantity: string;
  unitPrice: string;
  subCategory?: string;
}

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

      <div className="mt-10 flex w-full gap-3">
        {CURRENCIES.map(({ code, symbol, label }) => (
          <button
            key={code}
            onClick={() => onSelect(code)}
            className={`flex flex-1 flex-col items-center gap-2 rounded-2xl border-2 p-6 transition-all ${
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

      <p className="text-xs text-zinc-500 mt-6 text-center">
        You can change this anytime. Each asset can use a different currency.
      </p>
    </div>
  );
}

/* ───────────────────────── Category Picker ───────────────────────── */

type WizardCategory = "crypto" | "stocks" | "cash" | "other";

const CATEGORY_CARDS: {
  key: WizardCategory;
  label: string;
  subtitle: string;
  Icon: typeof Bitcoin;
}[] = [
  { key: "crypto", label: "Crypto", subtitle: "Auto prices", Icon: Bitcoin },
  { key: "stocks", label: "Stocks", subtitle: "Auto prices", Icon: TrendingUp },
  { key: "cash", label: "Cash & Bank", subtitle: "Manual entry", Icon: Banknote },
  { key: "other", label: "Other", subtitle: "Any asset type", Icon: Box },
];

function CategoryPicker({ onPick }: { onPick: (cat: WizardCategory) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {CATEGORY_CARDS.map(({ key, label, subtitle, Icon }) => (
        <button
          key={key}
          onClick={() => onPick(key)}
          className="flex flex-col items-center gap-2 rounded-2xl border-2 border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-800/50 active:scale-[0.98]"
        >
          <Icon className="h-6 w-6 text-zinc-300" />
          <span className="text-sm font-semibold text-white">{label}</span>
          <span className="text-[11px] text-zinc-500">{subtitle}</span>
        </button>
      ))}
    </div>
  );
}

/* ───────────────────────── Auto-price form (Crypto / Stocks) ──── */

const OTHER_SUBCATEGORIES = [
  "Real Estate",
  "Domains",
  "Gaming",
  "Vehicles",
  "Collectibles",
  "Other",
];

function AutoPriceForm({
  type,
  currency,
  categoryId,
  onAdd,
  onCancel,
}: {
  type: "crypto" | "stocks";
  currency: Currency;
  categoryId: string;
  onAdd: (draft: DraftAsset) => void;
  onCancel: () => void;
}) {
  const isCrypto = type === "crypto";
  const [ticker, setTicker] = useState("");
  const [priceResult, setPriceResult] = useState<TickerResult | null>(null);
  const [mode, setMode] = useState<"quantity" | "value">("quantity");
  const [quantity, setQuantity] = useState("1");
  const [manualValue, setManualValue] = useState("");

  const computedTotal =
    mode === "quantity" && priceResult
      ? (Number(quantity) || 0) * priceResult.price
      : Number(manualValue) || 0;

  const canAdd = ticker.trim() && priceResult && computedTotal > 0;

  function handleAdd() {
    if (!priceResult) return;
    const totalVal =
      mode === "quantity"
        ? ((Number(quantity) || 0) * priceResult.price).toString()
        : manualValue;
    onAdd({
      id: uuid(),
      name: priceResult.name,
      symbol: priceResult.symbol,
      categoryId,
      value: totalVal,
      currency: priceResult.currency,
      ticker: ticker.trim(),
      priceSource: isCrypto ? "coingecko" : "yahoo",
      quantity: mode === "quantity" ? quantity : "1",
      unitPrice: priceResult.price.toString(),
    });
  }

  return (
    <div className="w-full space-y-4">
      <button
        onClick={onCancel}
        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      <h3 className="text-lg font-semibold text-white">
        {isCrypto ? "Add Crypto" : "Add Stock"}
      </h3>

      <TickerInput
        type={type}
        value={ticker}
        onChange={setTicker}
        currency={currency}
        onResult={setPriceResult}
        onError={() => {}}
        onFetching={() => {}}
        inputClassName={inputClass}
        autoFocus
      />

      {priceResult && (
        <QuantityValueToggle
          mode={mode}
          onModeChange={setMode}
          quantity={quantity}
          onQuantityChange={setQuantity}
          manualValue={manualValue}
          onManualValueChange={setManualValue}
          computedTotal={computedTotal}
          currency={priceResult.currency}
          inputClassName={inputClass}
          toggleInactiveClassName="bg-zinc-800 text-zinc-400 hover:text-white"
        />
      )}

      <button
        onClick={handleAdd}
        disabled={!canAdd}
        className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600"
      >
        Add
      </button>
    </div>
  );
}

/* ───────────────────────── Manual form (Cash & Bank) ──────────── */

function ManualForm({
  currency,
  categoryId,
  placeholder,
  onAdd,
  onCancel,
  title,
  subCategory,
}: {
  currency: Currency;
  categoryId: string;
  placeholder: string;
  onAdd: (draft: DraftAsset) => void;
  onCancel: () => void;
  title: string;
  subCategory?: string;
}) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [cur, setCur] = useState<Currency>(currency);

  const canAdd = name.trim() && Number(value) > 0;

  function handleAdd() {
    onAdd({
      id: uuid(),
      name: name.trim(),
      symbol: "",
      categoryId,
      value,
      currency: cur,
      ticker: "",
      priceSource: "manual",
      quantity: "1",
      unitPrice: "",
      subCategory,
    });
  }

  return (
    <div className="w-full space-y-4">
      <button
        onClick={onCancel}
        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      <h3 className="text-lg font-semibold text-white">{title}</h3>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
        autoFocus
      />

      <div className="flex gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Value"
          className={`flex-1 ${inputClass}`}
          min="0"
          step="any"
        />
        <select
          value={cur}
          onChange={(e) => setCur(e.target.value as Currency)}
          className="w-24 appearance-none rounded-lg border border-zinc-700 bg-zinc-800 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat px-3 pr-10 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
        >
          <option value="CZK">CZK</option>
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
        </select>
      </div>

      <button
        onClick={handleAdd}
        disabled={!canAdd}
        className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600"
      >
        Add
      </button>
    </div>
  );
}

/* ───────────────────────── "Other" form (sub-category select) ─── */

function OtherForm({
  currency,
  categories,
  onAdd,
  onCancel,
}: {
  currency: Currency;
  categories: { id: string; name: string }[];
  onAdd: (draft: DraftAsset) => void;
  onCancel: () => void;
}) {
  const [subCat, setSubCat] = useState<string | null>(null);

  const SUB_CAT_MAP: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    for (const sc of OTHER_SUBCATEGORIES) {
      const match = categories.find(
        (c) => c.name.toLowerCase() === sc.toLowerCase()
      );
      if (match) map[sc] = match.id;
    }
    return map;
  }, [categories]);

  if (!subCat) {
    return (
      <div className="w-full space-y-4">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>

        <h3 className="text-lg font-semibold text-white">What type of asset?</h3>

        <div className="grid grid-cols-2 gap-2">
          {OTHER_SUBCATEGORIES.map((sc) => (
            <button
              key={sc}
              onClick={() => setSubCat(sc)}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:text-white active:scale-[0.98]"
            >
              {sc}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const categoryId =
    SUB_CAT_MAP[subCat] ||
    categories.find((c) => c.name.toLowerCase() === "other")?.id ||
    categories[categories.length - 1]?.id ||
    "";

  const placeholders: Record<string, string> = {
    "Real Estate": "Apartment, House, Land...",
    Domains: "example.com, mysite.io...",
    Gaming: "CS2 Skins, In-game items...",
    Vehicles: "Car, Motorcycle, Boat...",
    Collectibles: "Gold, Art, Wine...",
    Other: "Anything else...",
  };

  return (
    <ManualForm
      currency={currency}
      categoryId={categoryId}
      placeholder={placeholders[subCat] || "Name..."}
      onAdd={onAdd}
      onCancel={() => setSubCat(null)}
      title={`Add ${subCat}`}
      subCategory={subCat}
    />
  );
}

/* ───────────────────────── Completed asset card ─────────────────── */

function CompletedCard({
  draft,
  onRemove,
}: {
  draft: DraftAsset;
  onRemove: () => void;
}) {
  const isAuto = draft.priceSource !== "manual" && draft.ticker;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-white truncate flex items-center gap-1.5">
          {draft.name}
          {isAuto && (
            <span className="text-zinc-500 font-normal">
              &middot;{" "}
              {Number(draft.quantity).toLocaleString(undefined, {
                maximumFractionDigits: 6,
              })}{" "}
              {draft.symbol || draft.ticker.toUpperCase()}
            </span>
          )}
          <PriceSourceBadge source={draft.priceSource} size="sm" />
        </span>
      </div>
      <span className="text-sm text-zinc-400 shrink-0">
        {formatCurrency(Number(draft.value) || 0, draft.currency)}
      </span>
      <button
        onClick={onRemove}
        className="rounded-lg p-1 text-zinc-600 hover:text-red-400 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ───────────────────────── Step 2: Add Assets ───────────────────── */

function StepAssets({
  completedDrafts,
  setCompletedDrafts,
  currency,
}: {
  completedDrafts: DraftAsset[];
  setCompletedDrafts: React.Dispatch<React.SetStateAction<DraftAsset[]>>;
  currency: Currency;
}) {
  const categories = useLiveQuery(() =>
    db.categories.orderBy("sortOrder").toArray()
  );
  const catList = useMemo(
    () => categories?.map((c) => ({ id: c.id, name: c.name })) ?? [],
    [categories]
  );

  const [editingCategory, setEditingCategory] = useState<WizardCategory | null>(
    null
  );

  function resolveCategoryId(wizCat: WizardCategory): string {
    const nameMap: Record<string, string> = {
      crypto: "crypto",
      stocks: "stocks",
      cash: "cash & savings",
    };
    const target = nameMap[wizCat];
    if (!target) return "";
    return (
      catList.find((c) => c.name.toLowerCase() === target)?.id ??
      catList[0]?.id ??
      ""
    );
  }

  function handleAdd(draft: DraftAsset) {
    setCompletedDrafts((prev) => [...prev, draft]);
    setEditingCategory(null);
  }

  function handleRemove(id: string) {
    setCompletedDrafts((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="flex w-full max-w-lg flex-col items-center">
      <h2 className="text-2xl font-bold text-white sm:text-3xl">
        Add your assets
      </h2>
      <p className="mt-2 text-sm text-zinc-400">
        What do you own? You can always add more later.
      </p>

      <div className="mt-8 w-full space-y-4">
        {completedDrafts.length > 0 && (
          <div className="space-y-2">
            {completedDrafts.map((d) => (
              <CompletedCard
                key={d.id}
                draft={d}
                onRemove={() => handleRemove(d.id)}
              />
            ))}
          </div>
        )}

        {editingCategory === null ? (
          <>
            {completedDrafts.length > 0 && (
              <div className="flex items-center gap-3 my-2">
                <div className="h-px flex-1 bg-zinc-800" />
                <span className="text-xs text-zinc-500">Add another</span>
                <div className="h-px flex-1 bg-zinc-800" />
              </div>
            )}
            <CategoryPicker onPick={(cat) => setEditingCategory(cat)} />
          </>
        ) : editingCategory === "crypto" || editingCategory === "stocks" ? (
          <AutoPriceForm
            type={editingCategory}
            currency={currency}
            categoryId={resolveCategoryId(editingCategory)}
            onAdd={handleAdd}
            onCancel={() => setEditingCategory(null)}
          />
        ) : editingCategory === "cash" ? (
          <ManualForm
            currency={currency}
            categoryId={resolveCategoryId("cash")}
            placeholder="Savings account, Checking, Cash..."
            onAdd={handleAdd}
            onCancel={() => setEditingCategory(null)}
            title="Add Cash & Bank"
          />
        ) : (
          <OtherForm
            currency={currency}
            categories={catList}
            onAdd={handleAdd}
            onCancel={() => setEditingCategory(null)}
          />
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── Step 3: Review ───────────────────────── */

function StepReview({
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

  // Allocation breakdown by category
  const allocation = useMemo(() => {
    if (total <= 0) return [];
    const byCategory: Record<string, { name: string; value: number }> = {};
    for (const d of drafts) {
      const cat = catMap.get(d.categoryId);
      const catName = cat?.name ?? "Other";
      const val = convertCurrency(parseFloat(d.value) || 0, d.currency, currency, rates);
      if (!byCategory[catName]) byCategory[catName] = { name: catName, value: 0 };
      byCategory[catName].value += val;
    }
    return Object.values(byCategory)
      .map((c) => ({ name: c.name, pct: Math.round((c.value / total) * 100) }))
      .sort((a, b) => b.pct - a.pct);
  }, [drafts, catMap, total, currency, rates]);

  return (
    <div className="flex w-full max-w-lg flex-col items-center">
      <h2 className="text-2xl font-bold text-white sm:text-3xl">
        Review your portfolio
      </h2>
      <p className="mt-2 max-w-sm text-center text-sm text-zinc-400">
        Your net worth will be tracked automatically from now on.
      </p>

      <div className="mt-8 w-full rounded-xl border border-zinc-800 bg-zinc-900/50 divide-y divide-zinc-800">
        {drafts.map((d) => {
          const cat = catMap.get(d.categoryId);
          const Icon = cat ? getIcon(cat.icon) : getIcon("box");
          const badge = cat
            ? COLOR_BADGE_CLASSES[cat.color] ?? COLOR_BADGE_CLASSES.zinc
            : COLOR_BADGE_CLASSES.zinc;
          const isAuto = d.priceSource !== "manual";
          const catName = cat?.name ?? "Other";

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
                <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                  {isAuto ? (
                    <>
                      <span>
                        {Number(d.quantity).toLocaleString(undefined, { maximumFractionDigits: 6 })}{" "}
                        {d.symbol || d.ticker.toUpperCase()}
                      </span>
                      <span>&middot;</span>
                      <PriceSourceBadge source={d.priceSource} showLabel size="sm" />
                    </>
                  ) : (
                    <>
                      <span>{catName}</span>
                      <span>&middot;</span>
                      <PriceSourceBadge source="manual" showLabel size="sm" />
                    </>
                  )}
                </span>
              </div>
              <span className="text-sm text-zinc-400 shrink-0">
                {formatCurrency(
                  convertCurrency(
                    parseFloat(d.value) || 0,
                    d.currency,
                    currency,
                    rates
                  ),
                  currency
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* Allocation breakdown */}
      {allocation.length > 1 && (
        <p className="mt-4 text-sm text-zinc-400 text-center">
          {allocation.map((a, i) => (
            <span key={a.name}>
              {i > 0 && " · "}
              {a.name} {a.pct}%
            </span>
          ))}
        </p>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm text-zinc-500">Total net worth</p>
        <p className="mt-1 text-4xl font-bold text-white">
          {formatCurrency(total, currency)}
        </p>
      </div>

      <Button
        onClick={onSave}
        disabled={saving}
        className="mt-8 rounded-full px-8 py-3"
      >
        {saving ? "Saving..." : "Save & Start Tracking"}
      </Button>
    </div>
  );
}

/* ───────────────────────── Wizard ───────────────────────── */

export default function OnboardingWizard({
  onComplete,
  onClose,
}: {
  onComplete: () => void;
  onClose?: () => void;
}) {
  const [step, setStep] = useState(0);
  const [currency, setCurrency] = useState<Currency>("USD");

  const currencyDetected = useRef(false);
  useEffect(() => {
    if (!currencyDetected.current) {
      currencyDetected.current = true;
      setCurrency(detectCurrency());
    }
  }, []);

  const [completedDrafts, setCompletedDrafts] = useState<DraftAsset[]>([]);
  const [saving, setSaving] = useState(false);

  const { rates } = useExchangeRates();

  const validDrafts = completedDrafts.filter(
    (d) => d.name.trim() && d.categoryId && parseFloat(d.value) > 0
  );

  const canAdvance =
    step === 0 || (step === 1 && validDrafts.length > 0) || step === 2;

  async function saveAll() {
    setSaving(true);
    const now = new Date();
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

    const total = assets.reduce(
      (sum, a) =>
        sum + convertCurrency(a.currentValue, a.currency, currency, rates),
      0
    );

    await db.transaction("rw", [db.settings, db.assets, db.history], async () => {
      const existing = await db.settings.get("settings");
      await db.settings.put({
        id: "settings",
        theme: "dark",
        showHints: true,
        ...existing,
        primaryCurrency: currency,
      } as import("@/types").UserSettings);
      await db.assets.bulkAdd(assets);
      await db.history.add({
        totalValue: total,
        currency,
        createdAt: now,
      });
    });

    setSaving(false);
    onComplete();
  }

  function next() {
    if (step === 0) {
      setCompletedDrafts((prev) => prev.map((d) => ({ ...d, currency })));
      setStep(1);
    } else if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      saveAll();
    }
  }

  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#09090b]">
      <div className="shrink-0 px-6 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] pb-4 sm:px-10">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <ProgressBar step={step} />
          </div>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1 text-zinc-500 transition-colors hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 pb-32">
        {step === 0 && (
          <StepCurrency selected={currency} onSelect={setCurrency} />
        )}
        {step === 1 && (
          <StepAssets
            completedDrafts={completedDrafts}
            setCompletedDrafts={setCompletedDrafts}
            currency={currency}
          />
        )}
        {step === 2 && (
          <StepReview
            drafts={validDrafts}
            currency={currency}
            rates={rates}
            onSave={saveAll}
            saving={saving}
          />
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 border-t border-zinc-800/60 bg-[#09090b]/90 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <button
            onClick={back}
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
              {saving ? "Saving..." : "Save & Start Tracking"}
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
    </div>
  );
}
