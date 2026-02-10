"use client";

import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Plus, Bitcoin, TrendingUp, Banknote, Box, Landmark, CreditCard } from "lucide-react";
import { db } from "@/lib/db";
import { uuid, formatCurrency } from "@/lib/utils";
import { recordHistory } from "@/lib/history";
import { useExchangeRates } from "@/lib/useExchangeRates";
import { getIcon } from "@/lib/icons";
import { COLOR_BADGE_CLASSES } from "@/constants/colors";
import type { Currency, PriceSource } from "@/types";
import SlidePanel from "@/components/ui/SlidePanel";
import TickerInput, { type TickerResult } from "@/components/shared/TickerInput";
import QuantityValueToggle from "@/components/shared/QuantityValueToggle";
import CollapsibleSection from "@/components/shared/CollapsibleSection";
import Modal from "@/components/ui/Modal";
import CategoryForm from "@/components/settings/CategoryForm";
import Button from "@/components/ui/Button";

interface AddAssetPanelProps {
  open: boolean;
  onClose: () => void;
  defaultCategoryId?: string;
}

type SelectedType = "crypto" | "stocks" | "manual";

const DEFAULT_CATEGORY_NAMES: Record<string, true> = {
  crypto: true,
  stocks: true,
  "cash & savings": true,
  "cash & bank": true,
  other: true,
  "loans & mortgages": true,
  "credit cards": true,
};

function isDefaultCategory(name: string) {
  return DEFAULT_CATEGORY_NAMES[name.toLowerCase()] === true;
}

function categoryToType(name: string): SelectedType {
  const lower = name.toLowerCase();
  if (lower === "crypto") return "crypto";
  if (lower === "stocks") return "stocks";
  return "manual";
}

const inputClass =
  "w-full rounded-lg border border-[var(--dw-input-border)] bg-[var(--dw-input)] px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none dark:text-white dark:placeholder-zinc-500";

const CATEGORY_ICONS: Record<string, typeof Bitcoin> = {
  crypto: Bitcoin,
  stocks: TrendingUp,
  "cash & savings": Banknote,
  "cash & bank": Banknote,
  other: Box,
  "loans & mortgages": Landmark,
  "credit cards": CreditCard,
};

const CATEGORY_SUBTITLES: Record<string, string> = {
  crypto: "Auto prices",
  stocks: "Auto prices",
  "cash & savings": "Manual entry",
  "cash & bank": "Manual entry",
  other: "Any asset type",
  "loans & mortgages": "Debt tracking",
  "credit cards": "Debt tracking",
};

export default function AddAssetPanel({ open, onClose, defaultCategoryId }: AddAssetPanelProps) {
  const categories = useLiveQuery(() => db.categories.orderBy("sortOrder").toArray());
  const allAssets = useLiveQuery(() => db.assets.toArray());
  const settings = useLiveQuery(() => db.settings.get("settings"));

  const [step, setStep] = useState<"category" | "form">(defaultCategoryId ? "form" : "category");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(defaultCategoryId ?? null);
  const [selectedType, setSelectedType] = useState<SelectedType>("manual");
  const [createCategoryModalOpen, setCreateCategoryModalOpen] = useState(false);

  // Form state (declared before reset block)
  const [ticker, setTicker] = useState("");
  const [tickerResult, setTickerResult] = useState<TickerResult | null>(null);
  const [mode, setMode] = useState<"quantity" | "value">("quantity");
  const [quantity, setQuantity] = useState("1");
  const [manualValue, setManualValue] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualTotal, setManualTotal] = useState("");
  const [manualCurrency, setManualCurrency] = useState<Currency>(settings?.primaryCurrency ?? "CZK");
  const [group, setGroup] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset state when panel opens
  const [lastOpen, setLastOpen] = useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      if (defaultCategoryId) {
        setStep("form");
        setSelectedCategoryId(defaultCategoryId);
        const cat = categories?.find((c) => c.id === defaultCategoryId);
        setSelectedType(cat ? categoryToType(cat.name) : "manual");
      } else {
        setStep("category");
        setSelectedCategoryId(null);
        setSelectedType("manual");
      }
      setTicker("");
      setTickerResult(null);
      setMode("quantity");
      setQuantity("1");
      setManualValue("");
      setManualName("");
      setManualTotal("");
      setManualCurrency(settings?.primaryCurrency ?? "CZK");
      setGroup("");
      setNotes("");
      setSaving(false);
    }
  }

  const { rates } = useExchangeRates();

  const selectedCategory = useMemo(
    () => categories?.find((c) => c.id === selectedCategoryId),
    [categories, selectedCategoryId],
  );

  // Existing groups for selected category
  const existingGroups = useMemo(() => {
    if (!allAssets || !selectedCategoryId) return [];
    const groups = new Set<string>();
    for (const a of allAssets) {
      if (a.categoryId === selectedCategoryId && a.group) groups.add(a.group);
    }
    return [...groups].sort();
  }, [allAssets, selectedCategoryId]);

  const listId = `add-panel-groups-${selectedCategoryId}`;

  // Separate default asset vs default liability vs custom categories
  const defaultAssetCategories = useMemo(
    () => categories?.filter((c) => isDefaultCategory(c.name) && !c.isLiability) ?? [],
    [categories],
  );
  const defaultLiabilityCategories = useMemo(
    () => categories?.filter((c) => isDefaultCategory(c.name) && c.isLiability) ?? [],
    [categories],
  );
  const customCategories = useMemo(
    () => categories?.filter((c) => !isDefaultCategory(c.name)) ?? [],
    [categories],
  );

  // Auto-price computed total
  const computedTotal =
    mode === "quantity" && tickerResult
      ? (Number(quantity) || 0) * tickerResult.price
      : Number(manualValue) || 0;

  const isAutoType = selectedType === "crypto" || selectedType === "stocks";

  const canSave = isAutoType
    ? ticker.trim() && tickerResult && computedTotal > 0
    : manualName.trim() && Number(manualTotal) > 0;

  function handleCategoryPick(catId: string) {
    const cat = categories?.find((c) => c.id === catId);
    if (!cat) return;
    setSelectedCategoryId(catId);
    setSelectedType(categoryToType(cat.name));
    setStep("form");
    // Reset form
    setTicker("");
    setTickerResult(null);
    setMode("quantity");
    setQuantity("1");
    setManualValue("");
    setManualName("");
    setManualTotal("");
    setManualCurrency(settings?.primaryCurrency ?? "CZK");
    setGroup("");
    setNotes("");
  }

  function handleBack() {
    setStep("category");
  }

  async function handleSave() {
    if (!selectedCategoryId || saving) return;
    setSaving(true);

    const now = new Date();

    if (isAutoType && tickerResult) {
      const totalVal =
        mode === "quantity"
          ? (Number(quantity) || 0) * tickerResult.price
          : Number(manualValue) || 0;

      await db.assets.add({
        id: uuid(),
        name: tickerResult.name,
        categoryId: selectedCategoryId,
        group: group.trim() || undefined,
        currentValue: totalVal,
        currency: tickerResult.currency,
        notes: notes.trim() || undefined,
        ticker: ticker.trim(),
        priceSource: (selectedType === "crypto" ? "coingecko" : "yahoo") as PriceSource,
        quantity: mode === "quantity" ? (Number(quantity) || 1) : 1,
        unitPrice: tickerResult.price,
        lastPriceUpdate: now,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      await db.assets.add({
        id: uuid(),
        name: manualName.trim(),
        categoryId: selectedCategoryId,
        group: group.trim() || undefined,
        currentValue: Number(manualTotal) || 0,
        currency: manualCurrency,
        notes: notes.trim() || undefined,
        priceSource: "manual" as PriceSource,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    recordHistory("manual").catch(() => {});
    onClose();
  }

  function handleCategoryCreated() {
    setCreateCategoryModalOpen(false);
    // The new category will appear via useLiveQuery reactivity
  }

  const isLiabilityCategory = selectedCategory?.isLiability ?? false;
  const formTitle = isAutoType
    ? selectedType === "crypto"
      ? "Add Crypto"
      : "Add Stock"
    : `Add ${selectedCategory?.name ?? "Asset"}`;
  const saveLabel = isLiabilityCategory ? "Add Liability" : "Add Asset";

  return (
    <>
      <SlidePanel open={open} onClose={onClose}>
        {step === "category" ? (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Add Asset</h2>
            <p className="text-sm text-zinc-500">Choose a category to get started.</p>

            {/* Default asset categories 2×2 grid */}
            <div className="grid grid-cols-2 gap-3">
              {defaultAssetCategories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.name.toLowerCase()] ?? Box;
                const subtitle = CATEGORY_SUBTITLES[cat.name.toLowerCase()] ?? "Manual entry";
                const isAuto = subtitle === "Auto prices";
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryPick(cat.id)}
                    className="flex flex-col items-center gap-2 rounded-2xl border-2 border-[var(--dw-border)] bg-[var(--dw-card)] p-5 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/5 active:scale-[0.98]"
                  >
                    <Icon className="h-6 w-6 text-zinc-600 dark:text-zinc-300" />
                    <span className="text-sm font-semibold text-zinc-900 dark:text-white">{cat.name}</span>
                    <span className={`text-[11px] ${isAuto ? "text-emerald-500" : "text-zinc-500"}`}>
                      {subtitle}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Default liability categories */}
            {defaultLiabilityCategories.length > 0 && (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-red-500/20" />
                  <span className="text-xs font-medium text-red-400">Liabilities</span>
                  <div className="h-px flex-1 bg-red-500/20" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {defaultLiabilityCategories.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat.name.toLowerCase()] ?? Box;
                    const subtitle = CATEGORY_SUBTITLES[cat.name.toLowerCase()] ?? "Manual entry";
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryPick(cat.id)}
                        className="flex flex-col items-center gap-2 rounded-2xl border-2 border-[var(--dw-border)] bg-[var(--dw-card)] p-5 transition-all hover:border-red-500/50 hover:bg-red-500/5 active:scale-[0.98]"
                      >
                        <Icon className="h-6 w-6 text-zinc-600 dark:text-zinc-300" />
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">{cat.name}</span>
                        <span className="text-[11px] text-red-400">{subtitle}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Custom categories */}
            {customCategories.length > 0 && (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-[var(--dw-border)]" />
                  <span className="text-xs text-zinc-500">Custom</span>
                  <div className="h-px flex-1 bg-[var(--dw-border)]" />
                </div>
                <div className="space-y-2">
                  {customCategories.map((cat) => {
                    const CatIcon = getIcon(cat.icon);
                    const badge = COLOR_BADGE_CLASSES[cat.color] ?? COLOR_BADGE_CLASSES.zinc;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryPick(cat.id)}
                        className="flex w-full items-center gap-3 rounded-xl border border-[var(--dw-border)] bg-[var(--dw-card)] p-3 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/5 active:scale-[0.99]"
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${badge}`}>
                          <CatIcon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-zinc-900 dark:text-white">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Create new category */}
            <button
              onClick={() => setCreateCategoryModalOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--dw-border)] p-3 text-sm font-medium text-zinc-500 transition-colors hover:border-emerald-500/50 hover:text-emerald-500"
            >
              <Plus className="h-4 w-4" />
              Create new category
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Back + title */}
            {!defaultCategoryId && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
            )}
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{formTitle}</h2>

            {isAutoType ? (
              /* ── Auto-price form (Crypto / Stocks) ── */
              <div className="space-y-4">
                <TickerInput
                  type={selectedType as "crypto" | "stocks"}
                  value={ticker}
                  onChange={setTicker}
                  currency={manualCurrency}
                  onResult={setTickerResult}
                  onError={() => {}}
                  onFetching={() => {}}
                  inputClassName={inputClass}
                  autoFocus
                />

                {tickerResult && (
                  <QuantityValueToggle
                    mode={mode}
                    onModeChange={setMode}
                    quantity={quantity}
                    onQuantityChange={setQuantity}
                    manualValue={manualValue}
                    onManualValueChange={setManualValue}
                    computedTotal={computedTotal}
                    currency={tickerResult.currency}
                    inputClassName={inputClass}
                    toggleInactiveClassName="bg-[var(--dw-input)] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    quantityLabel={selectedType === "stocks" ? "I know the shares" : "I know the quantity"}
                  />
                )}

                <CollapsibleSection label="Optional">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">Group</label>
                    <input
                      type="text"
                      value={group}
                      onChange={(e) => setGroup(e.target.value)}
                      placeholder="e.g. Bitcoin, US Tech"
                      className={inputClass}
                      list={listId}
                    />
                    <datalist id={listId}>
                      {existingGroups.map((g) => (
                        <option key={g} value={g} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">Currency</label>
                    <select
                      value={manualCurrency}
                      onChange={(e) => setManualCurrency(e.target.value as Currency)}
                      className={inputClass}
                    >
                      <option value="CZK">CZK</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional notes..."
                      className={`${inputClass} resize-none`}
                      rows={2}
                    />
                  </div>
                </CollapsibleSection>

                <Button
                  onClick={handleSave}
                  disabled={!canSave || saving}
                  className="w-full"
                >
                  {saving ? "Adding..." : saveLabel}
                </Button>
              </div>
            ) : (
              /* ── Manual form (Cash, Other, Custom) ── */
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">Name</label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="e.g. Savings Account, Gold Ring"
                    className={inputClass}
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">Value</label>
                    <input
                      type="number"
                      value={manualTotal}
                      onChange={(e) => setManualTotal(e.target.value)}
                      placeholder="0"
                      className={inputClass}
                      min="0"
                      step="any"
                    />
                  </div>
                  <div className="w-24">
                    <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">Currency</label>
                    <select
                      value={manualCurrency}
                      onChange={(e) => setManualCurrency(e.target.value as Currency)}
                      className={inputClass}
                    >
                      <option value="CZK">CZK</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <CollapsibleSection label="Optional">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">Group</label>
                    <input
                      type="text"
                      value={group}
                      onChange={(e) => setGroup(e.target.value)}
                      placeholder="e.g. Bitcoin, US Tech"
                      className={inputClass}
                      list={listId}
                    />
                    <datalist id={listId}>
                      {existingGroups.map((g) => (
                        <option key={g} value={g} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional notes..."
                      className={`${inputClass} resize-none`}
                      rows={2}
                    />
                  </div>
                </CollapsibleSection>

                <Button
                  onClick={handleSave}
                  disabled={!canSave || saving}
                  className="w-full"
                >
                  {saving ? "Adding..." : saveLabel}
                </Button>
              </div>
            )}
          </div>
        )}
      </SlidePanel>

      {/* Category creation modal (sits on top of panel) */}
      <Modal
        open={createCategoryModalOpen}
        onClose={() => setCreateCategoryModalOpen(false)}
        title="New Category"
      >
        <CategoryForm onClose={handleCategoryCreated} />
      </Modal>
    </>
  );
}
