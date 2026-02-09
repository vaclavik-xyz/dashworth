"use client";

import { useState, useRef } from "react";
import { Check } from "lucide-react";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { convertCurrency } from "@/lib/exchange-rates";
import { recordHistory } from "@/lib/history";
import { usePrivacy } from "@/contexts/PrivacyContext";
import type { Asset, Currency } from "@/types";

const inputBase =
  "rounded-lg border border-[var(--dw-input-border)] bg-[var(--dw-input)] px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none dark:text-white dark:placeholder-zinc-500";
const inputClass = `w-full ${inputBase}`;

interface QuickUpdateFormProps {
  asset: Asset;
  currency: Currency;
  rates: Record<string, number>;
  noteOpen?: boolean;
  onNoteToggle?: () => void;
}

type AutoMode = "add" | "set-qty" | "set-value";

export default function QuickUpdateForm({ asset, currency, rates, noteOpen: noteOpenProp, onNoteToggle }: QuickUpdateFormProps) {
  const { hidden } = usePrivacy();
  const isAuto = asset.priceSource !== "manual";

  const [mode, setMode] = useState<AutoMode>("add");
  const [inputValue, setInputValue] = useState("");
  const [valueCurrency, setValueCurrency] = useState<Currency>(asset.currency);
  const [localNoteOpen, setLocalNoteOpen] = useState(false);
  const effectiveNoteOpen = onNoteToggle ? (noteOpenProp ?? false) : localNoteOpen;
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const successTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const cv = (v: number, from: Currency) => convertCurrency(v, from, currency, rates);
  const numInput = Number(inputValue) || 0;
  const currentQty = asset.quantity ?? 0;
  const currentUnitPrice = asset.unitPrice ?? 0;
  const priceAvailable = currentUnitPrice > 0;

  let newQty = currentQty;
  let newValue = asset.currentValue;
  let newValueCurrency: Currency = asset.currency;
  let isValid = false;
  let warning = "";

  if (isAuto) {
    switch (mode) {
      case "add":
        newQty = currentQty + numInput;
        newValue = newQty * currentUnitPrice;
        newValueCurrency = asset.currency;
        isValid = inputValue.trim() !== "" && numInput !== 0 && priceAvailable;
        if (newQty < 0) {
          warning = "Cannot have negative quantity";
          isValid = false;
        }
        break;
      case "set-qty":
        newQty = numInput;
        newValue = newQty * currentUnitPrice;
        newValueCurrency = asset.currency;
        isValid = inputValue.trim() !== "" && numInput >= 0 && numInput !== currentQty && priceAvailable;
        if (numInput < 0) {
          warning = "Cannot have negative quantity";
          isValid = false;
        }
        break;
      case "set-value":
        newQty = currentQty;
        newValue = numInput;
        newValueCurrency = valueCurrency;
        isValid = inputValue.trim() !== "" && numInput >= 0;
        break;
    }
  } else {
    newValue = numInput;
    newValueCurrency = valueCurrency;
    isValid = inputValue.trim() !== "" && numInput >= 0;
  }

  async function handleUpdate() {
    if (!isValid || saving) return;
    setSaving(true);

    const now = new Date();
    const currencyChanged = newValueCurrency !== asset.currency;
    const oldConverted = currencyChanged
      ? convertCurrency(asset.currentValue, asset.currency, newValueCurrency, rates)
      : asset.currentValue;

    if (Math.round(oldConverted) !== Math.round(newValue)) {
      await db.assetChanges.add({
        assetId: asset.id,
        assetName: asset.name,
        oldValue: oldConverted,
        newValue: newValue,
        currency: newValueCurrency,
        source: "manual",
        note: note.trim() || undefined,
        createdAt: now,
      });
    }

    const update: Record<string, unknown> = {
      currentValue: newValue,
      updatedAt: now,
    };
    if (isAuto && mode !== "set-value") {
      update.quantity = newQty;
    }
    if (currencyChanged) {
      update.currency = newValueCurrency;
    }

    await db.assets.update(asset.id, update);
    recordHistory("manual").catch(() => {});

    setInputValue("");
    setNote("");
    setLocalNoteOpen(false);
    setSaving(false);
    setSuccess(true);
    if (successTimer.current) clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setSuccess(false), 1000);
  }

  function switchMode(m: AutoMode) {
    setMode(m);
    setInputValue("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && isValid && !saving) {
      e.preventDefault();
      handleUpdate();
    }
  }

  const showPreview = inputValue.trim() !== "" && !warning;

  const tabs = isAuto
    ? [
        { key: "add" as AutoMode, label: "Add / remove" },
        { key: "set-qty" as AutoMode, label: "Set qty" },
        { key: "set-value" as AutoMode, label: "Set value" },
      ]
    : null;

  return (
    <div className="space-y-2.5" onClick={(e) => e.stopPropagation()}>
      {/* Tab-underline mode selector (auto-price only) + Note + gear */}
      {tabs && (
        <div className="flex items-end border-b border-[var(--dw-border)] pt-1.5">
          <div className="flex gap-4 flex-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => switchMode(t.key)}
                className={`pb-1.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                  mode === t.key
                    ? "border-emerald-500 text-emerald-500"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {!onNoteToggle && !localNoteOpen && (
            <button
              type="button"
              onClick={() => setLocalNoteOpen(true)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors pb-1.5 -mb-px shrink-0"
            >
              + Note
            </button>
          )}
        </div>
      )}

      {/* Price not available warning */}
      {isAuto && !priceAvailable && mode !== "set-value" && (
        <p className="text-xs text-amber-400">Fetching price...</p>
      )}

      {/* Input + Update button on same row */}
      <div className="flex gap-2 items-center">
        <div className="flex-1 flex gap-2">
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isAuto
                ? mode === "add"
                  ? "+20 or -5"
                  : mode === "set-qty"
                    ? String(currentQty)
                    : String(Math.round(asset.currentValue))
                : String(Math.round(asset.currentValue))
            }
            className={`${inputBase} min-w-0 flex-1`}
            step="any"
          />
          {(!isAuto || mode === "set-value") && (
            <select
              value={valueCurrency}
              onChange={(e) => setValueCurrency(e.target.value as Currency)}
              className={`${inputBase} w-20 shrink-0`}
            >
              <option value="CZK">CZK</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          )}
        </div>
        <button
          type="button"
          onClick={handleUpdate}
          disabled={!isValid || saving}
          className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
            success
              ? "bg-emerald-600 text-white"
              : isValid && !saving
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
          }`}
        >
          {success ? <Check className="h-3.5 w-3.5" /> : saving ? "..." : "Update"}
        </button>
      </div>

      {/* Warning */}
      {warning && <p className="text-xs text-red-400">{warning}</p>}

      {/* Preview */}
      {showPreview && !hidden && (
        <div className="text-xs space-y-0.5">
          {isAuto && mode !== "set-value" && (
            <p>
              <span className="text-zinc-500">
                {currentQty.toLocaleString(undefined, { maximumFractionDigits: 6 })} {asset.ticker?.toUpperCase()}
              </span>
              <span className="text-zinc-600 mx-1">&rarr;</span>
              <span className={newQty > currentQty ? "text-emerald-400" : newQty < currentQty ? "text-red-400" : "text-zinc-400"}>
                {newQty.toLocaleString(undefined, { maximumFractionDigits: 6 })} {asset.ticker?.toUpperCase()}
              </span>
            </p>
          )}
          <p>
            <span className="text-zinc-500">
              {formatCurrency(cv(asset.currentValue, asset.currency), currency)}
            </span>
            <span className="text-zinc-600 mx-1">&rarr;</span>
            <span className={cv(newValue, newValueCurrency) > cv(asset.currentValue, asset.currency) ? "text-emerald-400" : cv(newValue, newValueCurrency) < cv(asset.currentValue, asset.currency) ? "text-red-400" : "text-zinc-400"}>
              {formatCurrency(cv(newValue, newValueCurrency), currency)}
            </span>
          </p>
        </div>
      )}

      {/* Note input (when open) */}
      {effectiveNoteOpen && (
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Change note (optional)"
          className={inputClass}
          autoFocus
        />
      )}

      {/* Add note for manual assets */}
      {!onNoteToggle && !tabs && !localNoteOpen && (
        <button
          type="button"
          onClick={() => setLocalNoteOpen(true)}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          + Add note
        </button>
      )}
    </div>
  );
}
