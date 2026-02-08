"use client";

import { TrendingUp, TrendingDown, Eye, EyeOff } from "lucide-react";
import type { Currency, HistoryEntry } from "@/types";
import { formatCurrency, HIDDEN_VALUE } from "@/lib/utils";
import { usePrivacy } from "@/contexts/PrivacyContext";

interface NetWorthHeroProps {
  totalNetWorth: number;
  currency: Currency;
  lastEntry?: HistoryEntry;
  previousEntry?: HistoryEntry;
}

export default function NetWorthHero({
  totalNetWorth,
  currency,
  lastEntry,
  previousEntry,
}: NetWorthHeroProps) {
  const { hidden, toggle } = usePrivacy();

  const change =
    lastEntry && previousEntry
      ? lastEntry.totalValue - previousEntry.totalValue
      : null;
  const changePercent =
    change !== null && previousEntry && previousEntry.totalValue !== 0
      ? (change / previousEntry.totalValue) * 100
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
        {hidden ? HIDDEN_VALUE : formatCurrency(totalNetWorth, currency)}
      </p>
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
