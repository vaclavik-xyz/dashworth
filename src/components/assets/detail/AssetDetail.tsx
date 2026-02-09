"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Pencil,
  RefreshCw,
  Trash2,
  Zap,
  StickyNote,
  ChevronDown,
  RotateCcw,
  Settings,
} from "lucide-react";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, HIDDEN_VALUE } from "@/lib/utils";
import { convertCurrency } from "@/lib/exchange-rates";
import { recordHistory } from "@/lib/history";
import { getIcon } from "@/lib/icons";
import { COLOR_HEX, COLOR_BADGE_CLASSES } from "@/constants/colors";
import { useContainerWidth } from "@/hooks/useContainerWidth";
import { usePrivacy } from "@/contexts/PrivacyContext";
import Button from "@/components/ui/Button";
import TickerInput, { type TickerResult } from "@/components/shared/TickerInput";
import QuantityValueToggle from "@/components/shared/QuantityValueToggle";
import CollapsibleSection from "@/components/shared/CollapsibleSection";
import IconPicker from "@/components/ui/IconPicker";
import type { Asset, AssetChangeEntry, Category, Currency, PriceSource } from "@/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const inputClass =
  "w-full rounded-lg border border-[var(--dw-input-border)] bg-[var(--dw-input)] px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none dark:text-white dark:placeholder-zinc-500";

interface AssetDetailProps {
  asset: Asset;
  category: Category | undefined;
  changes: AssetChangeEntry[];
  currency: Currency;
  rates: Record<string, number>;
  allCategories: Category[];
  allAssets: Asset[];
  isEditing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  onDelete: () => void;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-700 dark:text-zinc-300">{value}</span>
    </div>
  );
}

function formatFullLabel(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function AssetDetail({
  asset,
  category,
  changes,
  currency,
  rates,
  allCategories,
  allAssets,
  isEditing,
  onEditStart,
  onEditEnd,
  onDelete,
}: AssetDetailProps) {
  const { hidden } = usePrivacy();
  const { ref, width } = useContainerWidth();
  const Icon = getIcon(asset.icon ?? category?.icon ?? "box");
  const catColor = COLOR_HEX[category?.color ?? "zinc"] ?? COLOR_HEX.zinc;
  const cv = (v: number, from: Currency) => convertCurrency(v, from, currency, rates);

  const [chartMode, setChartMode] = useState<"value" | "qty">("value");
  const showQtyToggle = asset.priceSource !== "manual" && asset.ticker && (asset.unitPrice ?? 0) > 0;

  /* ─── Edit form state ─── */
  const [editName, setEditName] = useState(asset.name);
  const [editCategoryId, setEditCategoryId] = useState(asset.categoryId);
  const [editGroup, setEditGroup] = useState(asset.group ?? "");
  const [editIcon, setEditIcon] = useState(asset.icon ?? "");
  const [editIconOpen, setEditIconOpen] = useState(false);
  const [editTicker, setEditTicker] = useState(asset.ticker ?? "");
  const [editUnitPrice, setEditUnitPrice] = useState(asset.unitPrice ?? 0);
  const [editTickerCurrency, setEditTickerCurrency] = useState<Currency>(asset.currency);
  const [editMode, setEditMode] = useState<"quantity" | "value">("quantity");
  const [editQuantity, setEditQuantity] = useState(asset.quantity?.toString() ?? "1");
  const [editManualValue, setEditManualValue] = useState(asset.currentValue.toString());
  const [editCurrentValue, setEditCurrentValue] = useState(asset.currentValue.toString());
  const [editCurrency, setEditCurrency] = useState<Currency>(asset.currency);
  const [editPriceSource, setEditPriceSource] = useState<PriceSource>(asset.priceSource);
  const [editNotes, setEditNotes] = useState(asset.notes ?? "");
  const [editUpdateNote, setEditUpdateNote] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Reset form state when entering edit mode
  const [lastIsEditing, setLastIsEditing] = useState(false);
  if (isEditing !== lastIsEditing) {
    setLastIsEditing(isEditing);
    if (isEditing) {
      setEditName(asset.name);
      setEditCategoryId(asset.categoryId);
      setEditGroup(asset.group ?? "");
      setEditIcon(asset.icon ?? "");
      setEditIconOpen(false);
      setEditTicker(asset.ticker ?? "");
      setEditUnitPrice(asset.unitPrice ?? 0);
      setEditTickerCurrency(asset.currency);
      setEditMode("quantity");
      setEditQuantity(asset.quantity?.toString() ?? "1");
      setEditManualValue(asset.currentValue.toString());
      setEditCurrentValue(asset.currentValue.toString());
      setEditCurrency(asset.currency);
      setEditPriceSource(asset.priceSource);
      setEditNotes(asset.notes ?? "");
      setEditUpdateNote("");
      setEditSaving(false);
    }
  }

  // Derived edit state
  const editSelectedCategory = useMemo(
    () => allCategories.find((c) => c.id === editCategoryId),
    [allCategories, editCategoryId],
  );
  const editCatName = editSelectedCategory?.name?.toLowerCase() ?? "";
  const editIsCrypto = editCatName === "crypto";
  const editIsStocks = editCatName === "stocks";
  const editShowTicker = editIsCrypto || editIsStocks;
  const editIsAutoPrice = editShowTicker && editPriceSource !== "manual";

  const existingGroups = useMemo(() => {
    const groups = new Set<string>();
    for (const a of allAssets) {
      if (a.categoryId === editCategoryId && a.group) groups.add(a.group);
    }
    return [...groups].sort();
  }, [allAssets, editCategoryId]);

  const listId = `edit-groups-${editCategoryId}`;

  const editComputedTotal =
    editMode === "quantity"
      ? (Number(editQuantity) || 0) * editUnitPrice
      : Number(editManualValue) || 0;

  function handleTickerResult(r: TickerResult | null) {
    if (r) {
      setEditUnitPrice(r.price);
      setEditTickerCurrency(r.currency);
    }
  }

  function handleCurrencyChange(newCur: Currency) {
    if (newCur === editCurrency) return;
    if (!editIsAutoPrice) {
      const numVal = Number(editCurrentValue);
      if (numVal > 0) {
        const converted = convertCurrency(numVal, editCurrency, newCur, rates);
        setEditCurrentValue(Math.round(converted).toString());
      }
    }
    setEditCurrency(newCur);
  }

  async function handleSave() {
    if (!editName.trim() || !editCategoryId || editSaving) return;
    setEditSaving(true);

    const now = new Date();
    const useAutoPrice = editIsAutoPrice && !!editTicker.trim();
    const finalValue = useAutoPrice
      ? editComputedTotal || asset.currentValue || 0
      : Number(editCurrentValue) || 0;
    const saveCurrency = useAutoPrice ? editTickerCurrency : editCurrency;

    const common = {
      name: editName.trim(),
      categoryId: editCategoryId,
      group: editGroup.trim() || undefined,
      icon: editIcon || undefined,
      currentValue: finalValue,
      currency: saveCurrency,
      notes: editNotes.trim() || undefined,
      ticker: editShowTicker && editTicker.trim() ? editTicker.trim() : undefined,
      priceSource: (editShowTicker && editTicker.trim() ? editPriceSource : "manual") as PriceSource,
      quantity: useAutoPrice ? (Number(editQuantity) || 1) : undefined,
      unitPrice: useAutoPrice ? editUnitPrice : undefined,
      lastPriceUpdate: editShowTicker && editTicker.trim() ? now : undefined,
      updatedAt: now,
    };

    // Track value changes
    const prev = await db.assets.get(asset.id);
    if (prev) {
      const currencyChanged = prev.currency !== saveCurrency;
      const oldConverted = currencyChanged
        ? convertCurrency(prev.currentValue, prev.currency, saveCurrency, rates)
        : prev.currentValue;
      const pctDiff =
        oldConverted > 0
          ? Math.abs(finalValue - oldConverted) / oldConverted
          : finalValue > 0
            ? 1
            : 0;
      const threshold = currencyChanged ? 0.05 : 0;
      if (pctDiff > threshold && Math.round(oldConverted) !== Math.round(finalValue)) {
        await db.assetChanges.add({
          assetId: asset.id,
          assetName: editName.trim(),
          oldValue: oldConverted,
          newValue: finalValue,
          currency: saveCurrency,
          source: "manual",
          note: editUpdateNote.trim() || undefined,
          createdAt: now,
        });
      }
    }

    await db.assets.update(asset.id, common);
    recordHistory("manual").catch(() => {});
    onEditEnd();
  }

  /* ─── Chart data (unchanged logic) ─── */
  const chartData = useMemo(() => {
    if (changes.length === 0) return [];

    const sorted = [...changes].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    const points: { idx: number; tickLabel: string; fullLabel: string; value: number }[] = [];
    let idx = 0;

    const firstDate = new Date(sorted[0].createdAt);
    points.push({
      idx: idx++,
      tickLabel: `${firstDate.getDate()} ${MONTHS[firstDate.getMonth()]}`,
      fullLabel: formatFullLabel(firstDate),
      value: cv(sorted[0].oldValue, sorted[0].currency),
    });

    for (const c of sorted) {
      const d = new Date(c.createdAt);
      points.push({
        idx: idx++,
        tickLabel: `${d.getDate()} ${MONTHS[d.getMonth()]}`,
        fullLabel: formatFullLabel(d),
        value: cv(c.newValue, c.currency),
      });
    }

    const lastPoint = points[points.length - 1];
    const currentConverted = cv(asset.currentValue, asset.currency);
    if (lastPoint && Math.round(lastPoint.value) !== Math.round(currentConverted)) {
      const now = new Date(asset.updatedAt);
      points.push({
        idx: idx++,
        tickLabel: `${now.getDate()} ${MONTHS[now.getMonth()]}`,
        fullLabel: formatFullLabel(now),
        value: currentConverted,
      });
    }

    return points;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changes, asset.currentValue, asset.updatedAt, currency, rates]);

  const manyPoints = chartData.length > 10;
  const maxTicks = Math.min(chartData.length, width < 300 ? 3 : 5);

  /* ═════════════════════════ EDIT MODE ═════════════════════════ */
  if (isEditing) {
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-white truncate">
            Edit {asset.name}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="secondary" onClick={onEditEnd} className="text-xs px-3 py-1.5">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={editSaving || !editName.trim() || !editCategoryId}
              className="text-xs px-3 py-1.5"
            >
              {editSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {/* ── Basics ── */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Basics</h4>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className={inputClass}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Category</label>
            <select
              value={editCategoryId}
              onChange={(e) => setEditCategoryId(e.target.value)}
              className={inputClass}
            >
              {allCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Price Source (auto-price only) ── */}
        {editShowTicker && (
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Price Source</h4>
            <p className="text-xs text-zinc-500">
              Source:{" "}
              <span className="text-zinc-700 dark:text-zinc-300">
                {editIsCrypto ? "CoinGecko" : "Yahoo Finance"}
              </span>
            </p>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">
                {editIsCrypto ? "Coin ID" : "Ticker"}
              </label>
              <TickerInput
                type={editIsCrypto ? "crypto" : "stocks"}
                value={editTicker}
                onChange={setEditTicker}
                currency={editCurrency}
                onResult={handleTickerResult}
                onError={() => {}}
                onFetching={() => {}}
                inputClassName={inputClass}
              />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={editPriceSource !== "manual"}
                onChange={(e) =>
                  setEditPriceSource(
                    e.target.checked ? (editIsCrypto ? "coingecko" : "yahoo") : "manual",
                  )
                }
                className="h-4 w-4 rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-800"
              />
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                Auto-update price on app open
              </span>
            </label>
          </div>
        )}

        {/* ── Value ── */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Value</h4>
          {editIsAutoPrice && editTicker.trim() ? (
            <QuantityValueToggle
              mode={editMode}
              onModeChange={setEditMode}
              quantity={editQuantity}
              onQuantityChange={setEditQuantity}
              manualValue={editManualValue}
              onManualValueChange={setEditManualValue}
              computedTotal={editComputedTotal}
              currency={editTickerCurrency}
              inputClassName={inputClass}
              toggleInactiveClassName="bg-[var(--dw-input)] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              quantityLabel={editIsStocks ? "Shares" : "Quantity"}
            />
          ) : (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-zinc-500">Value</label>
                <input
                  type="number"
                  value={editCurrentValue}
                  onChange={(e) => setEditCurrentValue(e.target.value)}
                  className={inputClass}
                  min="0"
                  step="any"
                />
              </div>
              <div className="w-24">
                <label className="mb-1 block text-xs font-medium text-zinc-500">Currency</label>
                <select
                  value={editCurrency}
                  onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
                  className={inputClass}
                >
                  <option value="CZK">CZK</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ── Optional ── */}
        <CollapsibleSection label="Optional">
          {/* Icon */}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Icon</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditIconOpen(!editIconOpen)}
                className={`flex h-9 items-center gap-2 rounded-lg border border-[var(--dw-input-border)] bg-[var(--dw-input)] px-3 text-sm transition-colors ${
                  editIconOpen ? "border-emerald-500" : ""
                }`}
              >
                {(() => {
                  const effectiveIcon = editIcon || editSelectedCategory?.icon || "box";
                  const Preview = getIcon(effectiveIcon);
                  return <Preview className="h-4 w-4 text-zinc-400" />;
                })()}
                <span className="text-zinc-500 text-xs">
                  {editIcon ? "Custom" : "Category default"}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${editIconOpen ? "rotate-180" : ""}`}
                />
              </button>
              {editIcon && (
                <button
                  type="button"
                  onClick={() => {
                    setEditIcon("");
                    setEditIconOpen(false);
                  }}
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              )}
            </div>
            {editIconOpen && (
              <div className="mt-2">
                <IconPicker
                  value={editIcon || editSelectedCategory?.icon || "box"}
                  onChange={(v) => setEditIcon(v === editSelectedCategory?.icon ? "" : v)}
                  color={
                    editSelectedCategory
                      ? (COLOR_BADGE_CLASSES[editSelectedCategory.color] ?? COLOR_BADGE_CLASSES.zinc)
                      : undefined
                  }
                />
              </div>
            )}
          </div>

          {/* Group */}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Group</label>
            <input
              type="text"
              value={editGroup}
              onChange={(e) => setEditGroup(e.target.value)}
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

          {/* Currency (auto-price only — manual already has currency in Value section) */}
          {editIsAutoPrice && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Currency</label>
              <select
                value={editCurrency}
                onChange={(e) => setEditCurrency(e.target.value as Currency)}
                className={inputClass}
              >
                <option value="CZK">CZK</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Notes</label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Optional notes..."
              className={`${inputClass} resize-none`}
              rows={2}
            />
          </div>

          {/* Change note */}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Change note</label>
            <input
              type="text"
              value={editUpdateNote}
              onChange={(e) => setEditUpdateNote(e.target.value)}
              placeholder='e.g. "Rebalanced portfolio"'
              className={inputClass}
            />
            <p className="mt-1 text-[10px] text-zinc-500">One-time note attached to this update</p>
          </div>
        </CollapsibleSection>

        {/* Bottom save/cancel */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onEditEnd} className="text-xs px-3 py-1.5">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={editSaving || !editName.trim() || !editCategoryId}
            className="text-xs px-3 py-1.5"
          >
            {editSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    );
  }

  /* ═════════════════════════ READ MODE ═════════════════════════ */
  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="h-5 w-5 shrink-0" style={{ color: catColor }} />
            <h3 className="text-sm font-medium text-zinc-900 dark:text-white truncate">
              {asset.name}
            </h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onEditStart}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-[var(--dw-hover)] hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white transition-colors"
              aria-label="Edit settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-[var(--dw-hover)] hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-colors"
              aria-label="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">
          {hidden ? HIDDEN_VALUE : formatCurrency(cv(asset.currentValue, asset.currency), currency)}
        </p>
        {asset.currency !== currency && !hidden && (
          <p className="text-xs text-zinc-500">
            {formatCurrency(asset.currentValue, asset.currency)}
          </p>
        )}
      </div>

      {/* Info pairs */}
      <div className="space-y-2">
        <InfoRow label="Category" value={category?.name ?? "Unknown"} />
        <InfoRow
          label="Source"
          value={
            <span className="inline-flex items-center gap-1.5">
              {asset.priceSource === "coingecko"
                ? "CoinGecko"
                : asset.priceSource === "yahoo"
                  ? "Yahoo Finance"
                  : "Manual"}
              {asset.priceSource !== "manual" ? (
                <span className="inline-flex items-center gap-0.5 text-emerald-400">
                  <Zap className="h-3 w-3" />
                  <span className="text-[10px]">Auto price</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-zinc-500">
                  <Pencil className="h-3 w-3" />
                  <span className="text-[10px]">Manual</span>
                </span>
              )}
            </span>
          }
        />
        {asset.quantity != null && asset.ticker && (
          <InfoRow
            label="Quantity"
            value={`${Number(asset.quantity).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${asset.ticker.toUpperCase()}`}
          />
        )}
        {asset.group && <InfoRow label="Group" value={asset.group} />}
        <InfoRow label="Currency" value={asset.currency} />
        <InfoRow
          label="Updated"
          value={`${formatDate(asset.updatedAt)}, ${new Date(asset.updatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`}
        />
      </div>

      {/* Notes */}
      {asset.notes && (
        <div className="flex items-start gap-2 rounded-lg bg-[var(--dw-hover)] p-3">
          <StickyNote className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-600 dark:text-zinc-400">{asset.notes}</p>
        </div>
      )}

      {/* Value / Qty chart */}
      {chartData.length >= 2 && (
        <div>
          <h4
            className={`mb-2 text-xs font-medium text-zinc-400 ${showQtyToggle ? "cursor-pointer hover:text-zinc-300 transition-colors" : ""}`}
            onClick={() => {
              if (showQtyToggle) setChartMode((m) => (m === "value" ? "qty" : "value"));
            }}
          >
            {chartMode === "value" ? "Value Over Time" : "QTY Over Time"}
            {showQtyToggle && (
              <span className="ml-1.5 text-[10px] text-emerald-500">
                tap to switch
              </span>
            )}
          </h4>
          <div ref={ref} className="overflow-hidden">
            {width > 0 && (() => {
              const unitPrice = asset.unitPrice ?? 1;
              const displayData = chartMode === "qty"
                ? chartData.map((p) => ({ ...p, value: p.value / unitPrice }))
                : chartData;
              const ticker = asset.ticker?.toUpperCase() ?? "";

              return (
                <LineChart width={width} height={160} data={displayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--dw-grid)" />
                  <XAxis
                    dataKey="idx"
                    type="number"
                    domain={[0, displayData.length - 1]}
                    tick={{ fontSize: 10 }}
                    className="[&_.recharts-text]:fill-zinc-500"
                    axisLine={{ stroke: "var(--dw-grid)" }}
                    tickLine={false}
                    tickCount={maxTicks}
                    tickFormatter={(idx: number) => displayData[idx]?.tickLabel ?? ""}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    className="[&_.recharts-text]:fill-zinc-500"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) =>
                      chartMode === "qty"
                        ? v.toLocaleString(undefined, { maximumFractionDigits: 2 })
                        : hidden ? HIDDEN_VALUE : formatCurrency(v, currency)
                    }
                    width={70}
                  />
                  <Tooltip
                    allowEscapeViewBox={{ x: false, y: false }}
                    contentStyle={{
                      backgroundColor: "var(--tooltip-bg, #18181b)",
                      border: "1px solid var(--tooltip-border, #27272a)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "var(--tooltip-text, #fafafa)",
                    }}
                    labelStyle={{ color: "var(--tooltip-label, #a1a1aa)" }}
                    labelFormatter={(_label, payload) => {
                      const item = payload?.[0]?.payload;
                      return item?.fullLabel ?? _label;
                    }}
                    formatter={(value: number | undefined) => [
                      chartMode === "qty"
                        ? `${(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${ticker}`
                        : hidden ? HIDDEN_VALUE : formatCurrency(value ?? 0, currency),
                      chartMode === "qty" ? "Quantity" : "Value",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={catColor}
                    strokeWidth={2}
                    dot={manyPoints ? false : { fill: catColor, r: 3 }}
                    activeDot={{ r: 5, stroke: catColor, strokeWidth: 2, fill: "#18181b" }}
                  />
                </LineChart>
              );
            })()}
          </div>
        </div>
      )}

      {/* Changes timeline */}
      {changes.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-medium text-zinc-400">
            Changes
            <span className="ml-1.5 text-[10px] text-emerald-500">{changes.length}</span>
          </h4>
          <div className="space-y-1.5">
            {changes.slice(0, 20).map((entry, i) => {
              const newVal = cv(entry.newValue, entry.currency);
              const oldVal = cv(entry.oldValue, entry.currency);
              const delta = newVal - oldVal;
              const pct = oldVal > 0 ? (delta / oldVal) * 100 : 0;

              return (
                <div key={entry.id ?? i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {delta > 0 ? (
                      <TrendingUp className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    ) : delta < 0 ? (
                      <TrendingDown className="h-3.5 w-3.5 shrink-0 text-red-500" />
                    ) : (
                      <Minus className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-zinc-500 truncate">
                          {formatDate(entry.createdAt)}
                        </span>
                        {entry.source === "auto" ? (
                          <RefreshCw className="h-2.5 w-2.5 text-blue-400/60" />
                        ) : (
                          <Pencil className="h-2.5 w-2.5 text-zinc-500/60" />
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 block">
                        {new Date(entry.createdAt).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {entry.note && (
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 italic truncate block">
                          {entry.note}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xs font-medium text-zinc-900 dark:text-white">
                      {hidden ? HIDDEN_VALUE : formatCurrency(newVal, currency)}
                    </span>
                    {delta !== 0 && (
                      <p
                        className={`text-[10px] ${delta > 0 ? "text-emerald-500" : "text-red-500"}`}
                      >
                        {delta > 0 ? "+" : ""}
                        {hidden ? "" : formatCurrency(delta, currency)} ({pct > 0 ? "+" : ""}
                        {pct.toFixed(1)}%)
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {changes.length === 0 && (
        <p className="text-xs text-zinc-500 text-center py-2">No changes recorded yet</p>
      )}
    </div>
  );
}
