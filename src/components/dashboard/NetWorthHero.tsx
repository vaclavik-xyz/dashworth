"use client";

import { TrendingUp, TrendingDown, Eye, EyeOff } from "lucide-react";
import type { Currency, HistoryEntry } from "@/types";
import { formatCurrency, HIDDEN_VALUE } from "@/lib/utils";
import { convertCurrency } from "@/lib/exchange-rates";
import { usePrivacy } from "@/contexts/PrivacyContext";

interface NetWorthHeroProps {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  currency: Currency;
  rates: Record<string, number>;
  lastEntry?: HistoryEntry;
  previousEntry?: HistoryEntry;
}

export default function NetWorthHero({
  totalAssets,
  totalLiabilities,
  netWorth,
  currency,
  rates,
  lastEntry,
  previousEntry,
}: NetWorthHeroProps) {
  const { hidden, toggle } = usePrivacy();

  const lastVal = lastEntry ? convertCurrency(lastEntry.totalValue, lastEntry.currency, currency, rates) : null;
  const prevVal = previousEntry ? convertCurrency(previousEntry.totalValue, previousEntry.currency, currency, rates) : null;
  const change = lastVal !== null && prevVal !== null ? lastVal - prevVal : null;
  const changePercent =
    change !== null && prevVal && prevVal !== 0
      ? (change / prevVal) * 100
      : null;

  return (
    <div>
      <div className="flex items-center gap-2">
        <p className="text-sm text-zinc-500">Total net worth</p>
        <button
          type="button"
          onClick={toggle}
          className="rounded-md p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
          aria-label={hidden ? "Show values" : "Hide values"}
        >
          {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <p className="mt-1 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white md:text-5xl">
        {hidden ? HIDDEN_VALUE : formatCurrency(netWorth, currency)}
      </p>
      {totalLiabilities > 0 && (
        <div className="mt-1.5 flex items-center gap-3 text-sm">
          <span className="text-emerald-400">
            {hidden ? HIDDEN_VALUE : formatCurrency(totalAssets, currency)}
            <span className="ml-1 text-xs text-zinc-500">assets</span>
          </span>
          <span className="text-red-400">
            {hidden ? HIDDEN_VALUE : `−${formatCurrency(totalLiabilities, currency)}`}
            <span className="ml-1 text-xs text-zinc-500">debt</span>
          </span>
        </div>
      )}
      {change !== null && changePercent !== null && (
        <div className="mt-2 flex items-center gap-1.5">
          {change >= 0 ? (
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-400" />
          )}
          <span
            className={`text-sm font-medium ${
              change >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {hidden ? (
              <>{change >= 0 ? "+" : ""}{changePercent.toFixed(1)}%</>
            ) : (
              <>
                {change >= 0 ? "+" : ""}
                {formatCurrency(change, currency)}
                {" "}({change >= 0 ? "+" : ""}{changePercent.toFixed(1)}%)
              </>
            )}
          </span>
          <span className="text-xs text-zinc-600">vs previous</span>
        </div>
      )}
    </div>
  );
}
