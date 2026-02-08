"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Currency, HistoryEntry } from "@/types";
import { formatCurrency, formatDate, HIDDEN_VALUE } from "@/lib/utils";
import Card from "@/components/ui/Card";
import { usePrivacy } from "@/contexts/PrivacyContext";

interface HistoryLogProps {
  history: HistoryEntry[];
  currency: Currency;
}

export default function HistoryLog({ history, currency }: HistoryLogProps) {
  const { hidden } = usePrivacy();

  if (history.length === 0) return null;

  // history is already sorted newest-first from the parent
  const entries = history.slice(0, 10);

  return (
    <Card>
      <h2 className="mb-3 text-sm font-medium text-zinc-400">History</h2>
      <div className="space-y-2">
        {entries.map((entry, i) => {
          const prev = history[i + 1];
          const delta = prev ? entry.totalValue - prev.totalValue : 0;
          const pct = prev && prev.totalValue > 0
            ? ((delta / prev.totalValue) * 100)
            : 0;

          return (
            <div
              key={entry.id ?? i}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {delta > 0 ? (
                  <TrendingUp className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : delta < 0 ? (
                  <TrendingDown className="h-4 w-4 shrink-0 text-red-500" />
                ) : (
                  <Minus className="h-4 w-4 shrink-0 text-zinc-500" />
                )}
                <span className="text-sm text-zinc-500 truncate">
                  {formatDate(entry.createdAt)}
                </span>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {hidden ? HIDDEN_VALUE : formatCurrency(entry.totalValue, currency)}
                </span>
                {prev && delta !== 0 && (
                  <p className={`text-xs ${delta > 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {hidden
                      ? <>{pct > 0 ? "+" : ""}{pct.toFixed(1)}%</>
                      : <>{delta > 0 ? "+" : ""}{formatCurrency(delta, currency)} ({pct > 0 ? "+" : ""}{pct.toFixed(1)}%)</>
                    }
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
