"use client";

import { formatCurrency } from "@/lib/utils";
import type { Currency } from "@/types";

interface QuantityValueToggleProps {
  mode: "quantity" | "value";
  onModeChange: (m: "quantity" | "value") => void;
  quantity: string;
  onQuantityChange: (v: string) => void;
  manualValue: string;
  onManualValueChange: (v: string) => void;
  computedTotal: number;
  currency: Currency;
  inputClassName: string;
  toggleInactiveClassName?: string;
  quantityLabel?: string;
}

export default function QuantityValueToggle({
  mode,
  onModeChange,
  quantity,
  onQuantityChange,
  manualValue,
  onManualValueChange,
  computedTotal,
  currency,
  inputClassName,
  toggleInactiveClassName = "bg-zinc-800 text-zinc-400 hover:text-white",
  quantityLabel = "I know the quantity",
}: QuantityValueToggleProps) {
  return (
    <div className="space-y-3">
      <div className="flex rounded-lg border border-[var(--dw-input-border,theme(colors.zinc.700))] overflow-hidden">
        <button
          type="button"
          onClick={() => onModeChange("quantity")}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            mode === "quantity"
              ? "bg-emerald-600 text-white"
              : toggleInactiveClassName
          }`}
        >
          {quantityLabel}
        </button>
        <button
          type="button"
          onClick={() => onModeChange("value")}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            mode === "value"
              ? "bg-emerald-600 text-white"
              : toggleInactiveClassName
          }`}
        >
          I know the total value
        </button>
      </div>

      {mode === "quantity" ? (
        <div className="space-y-2">
          <input
            type="number"
            value={quantity}
            onChange={(e) => onQuantityChange(e.target.value)}
            placeholder="e.g. 0.5"
            className={inputClassName}
            min="0"
            step="any"
          />
          {computedTotal > 0 && (
            <div className="rounded-lg bg-[var(--dw-hover,theme(colors.zinc.800/50))] px-3 py-2 text-right">
              <span className="text-xs text-zinc-500">Total: </span>
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                {formatCurrency(computedTotal, currency)}
              </span>
            </div>
          )}
        </div>
      ) : (
        <input
          type="number"
          value={manualValue}
          onChange={(e) => onManualValueChange(e.target.value)}
          placeholder="Total value"
          className={inputClassName}
          min="0"
          step="any"
        />
      )}
    </div>
  );
}
