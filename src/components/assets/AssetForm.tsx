"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Loader2 } from "lucide-react";
import { db } from "@/lib/db";
import { uuid, formatCurrency } from "@/lib/utils";
import { fetchCryptoPrice, fetchStockPrice } from "@/lib/price-feeds";
import type { Asset, Currency, PriceSource } from "@/types";
import Button from "@/components/ui/Button";

interface AssetFormProps {
  asset?: Asset;
  onClose: () => void;
}

export default function AssetForm({ asset, onClose }: AssetFormProps) {
  const categories = useLiveQuery(() => db.categories.orderBy("sortOrder").toArray());
  const allAssets = useLiveQuery(() => db.assets.toArray());

  const [name, setName] = useState(asset?.name ?? "");
  const [categoryId, setCategoryId] = useState(asset?.categoryId ?? "");
  const [group, setGroup] = useState(asset?.group ?? "");
  const [currentValue, setCurrentValue] = useState(asset?.currentValue?.toString() ?? "");
  const [currency, setCurrency] = useState<Currency>(asset?.currency ?? "CZK");
  const [notes, setNotes] = useState(asset?.notes ?? "");
  const [ticker, setTicker] = useState(asset?.ticker ?? "");
  const [priceSource, setPriceSource] = useState<PriceSource>(asset?.priceSource ?? "manual");
  const [quantity, setQuantity] = useState(asset?.quantity?.toString() ?? "1");
  const [unitPrice, setUnitPrice] = useState(asset?.unitPrice?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  // Determine selected category name
  const selectedCategory = useMemo(
    () => categories?.find((c) => c.id === categoryId),
    [categories, categoryId],
  );
  const catName = selectedCategory?.name?.toLowerCase() ?? "";
  const isCrypto = catName === "crypto";
  const isStocks = catName === "stocks";
  const showTicker = isCrypto || isStocks;
  const isAutoFetch = showTicker && priceSource !== "manual";

  // Computed total for auto-fetch assets
  const computedTotal = (Number(quantity) || 0) * (Number(unitPrice) || 0);

  // When category changes, set price source
  useEffect(() => {
    if (!asset) {
      if (isCrypto) setPriceSource("coingecko");
      else if (isStocks) setPriceSource("yahoo");
      else {
        setPriceSource("manual");
        setTicker("");
      }
    }
  }, [categoryId, isCrypto, isStocks, asset]);

  // Existing groups for the selected category (for autocomplete)
  const existingGroups = useMemo(() => {
    if (!allAssets || !categoryId) return [];
    const groups = new Set<string>();
    for (const a of allAssets) {
      if (a.categoryId === categoryId && a.group) groups.add(a.group);
    }
    return [...groups].sort();
  }, [allAssets, categoryId]);

  const fetchPrice = useCallback(async () => {
    if (!ticker.trim()) return;
    setFetchingPrice(true);
    setPriceError(null);

    try {
      let prices: Record<string, number> | null = null;
      if (isCrypto) {
        prices = await fetchCryptoPrice(ticker.trim());
      } else if (isStocks) {
        prices = await fetchStockPrice(ticker.trim());
      }

      if (!prices) {
        setPriceError("Price not found. Check the ticker.");
        return;
      }

      const price = prices[currency];
      if (price != null) {
        setUnitPrice(price.toString());
      } else {
        const usd = prices["USD"];
        if (usd != null) {
          setUnitPrice(usd.toString());
          setCurrency("USD");
        } else {
          setPriceError("Price not available for selected currency.");
        }
      }
    } catch {
      setPriceError("Failed to fetch price.");
    } finally {
      setFetchingPrice(false);
    }
  }, [ticker, isCrypto, isStocks, currency]);

  // Auto-fetch price when ticker changes (debounced)
  useEffect(() => {
    if (!showTicker || !ticker.trim()) return;
    const timeout = setTimeout(fetchPrice, 800);
    return () => clearTimeout(timeout);
  }, [ticker, showTicker, fetchPrice]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !categoryId) return;

    setSaving(true);
    const now = new Date();

    const finalValue = isAutoFetch ? computedTotal : (Number(currentValue) || 0);

    const common = {
      name: name.trim(),
      categoryId,
      group: group.trim() || undefined,
      currentValue: finalValue,
      currency,
      notes: notes.trim() || undefined,
      ticker: showTicker && ticker.trim() ? ticker.trim() : undefined,
      priceSource: showTicker ? priceSource : ("manual" as PriceSource),
      quantity: isAutoFetch ? (Number(quantity) || 1) : undefined,
      unitPrice: isAutoFetch ? (Number(unitPrice) || 0) : undefined,
      lastPriceUpdate: showTicker && ticker.trim() ? now : undefined,
      updatedAt: now,
    };

    if (asset) {
      await db.assets.update(asset.id, common);
    } else {
      await db.assets.add({
        id: uuid(),
        ...common,
        isArchived: false,
        createdAt: now,
      });
    }

    onClose();
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500";

  const readOnlyClass =
    "w-full rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400";

  const listId = `groups-${categoryId}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Bitcoin — Trezor, Apple (AAPL)"
          className={inputClass}
          required
          autoFocus
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={inputClass}
          required
        >
          <option value="">Select category...</option>
          {categories?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Ticker field for Crypto / Stocks */}
      {showTicker && (
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {isCrypto ? "CoinGecko ID" : "Ticker Symbol"}
          </label>
          <div className="relative">
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder={isCrypto ? "e.g. bitcoin, ethereum, solana, cardano" : "e.g. AAPL, TSLA, MSFT"}
              className={inputClass}
            />
            {fetchingPrice && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-400" />
            )}
          </div>
          {priceError && (
            <p className="mt-1 text-xs text-red-400">{priceError}</p>
          )}
          <p className="mt-1 text-xs text-zinc-500">
            {isCrypto
              ? "Enter a CoinGecko ID to auto-fetch the price"
              : "Enter a ticker to auto-fetch the price (via CORS proxy)"}
          </p>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Group <span className="text-zinc-400 dark:text-zinc-500 font-normal">(optional)</span>
        </label>
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

      {/* Auto-fetch: quantity + unit price + computed total */}
      {isAutoFetch && ticker.trim() ? (
        <>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 0.348"
                className={inputClass}
                min="0"
                step="any"
              />
            </div>
            <div className="w-28">
              <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className={inputClass}
              >
                <option value="CZK">CZK</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">Unit Price</label>
            <input
              type="number"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="Auto-fetched"
              className={inputClass}
              min="0"
              step="any"
            />
          </div>

          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Total Value</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-white">
                {formatCurrency(computedTotal, currency)}
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">Value</label>
            <input
              type="number"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              placeholder="0"
              className={inputClass}
              min="0"
              step="any"
            />
          </div>
          <div className="w-28">
            <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className={inputClass}
            >
              <option value="CZK">CZK</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
      )}

      {/* Auto-update toggle for assets with ticker */}
      {showTicker && ticker.trim() && (
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={priceSource !== "manual"}
            onChange={(e) =>
              setPriceSource(e.target.checked ? (isCrypto ? "coingecko" : "yahoo") : "manual")
            }
            className="h-4 w-4 rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-800"
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Auto-update price on app open
          </span>
        </label>
      )}

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

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !name.trim() || !categoryId}>
          {asset ? "Save Changes" : "Add Asset"}
        </Button>
      </div>
    </form>
  );
}
