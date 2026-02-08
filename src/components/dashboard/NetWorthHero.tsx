"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import type { Currency, HistoryEntry } from "@/types";
import { formatCurrency } from "@/lib/utils";

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
      <p className="text-sm text-zinc-500">Total net worth</p>
      <p className="mt-1 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white md:text-5xl">
        {formatCurrency(totalNetWorth, currency)}
      </p>
      {change !== null && (
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
            {change >= 0 ? "+" : ""}
            {formatCurrency(change, currency)}
            {changePercent !== null && (
              <> ({change >= 0 ? "+" : ""}{changePercent.toFixed(1)}%)</>
            )}
          </span>
          <span className="text-xs text-zinc-600">vs previous</span>
        </div>
      )}
    </div>
  );
}
