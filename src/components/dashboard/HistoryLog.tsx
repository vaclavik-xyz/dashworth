"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Pencil } from "lucide-react";
import type { Currency, HistoryEntry, AssetChangeEntry } from "@/types";
import { formatCurrency, formatDate, HIDDEN_VALUE } from "@/lib/utils";
import Card from "@/components/ui/Card";
import { usePrivacy } from "@/contexts/PrivacyContext";

type TimelineItem =
  | { kind: "networth"; entry: HistoryEntry; delta: number; pct: number }
  | { kind: "asset"; entry: AssetChangeEntry };

interface HistoryLogProps {
  history: HistoryEntry[];
  assetChanges: AssetChangeEntry[];
  currency: Currency;
}

export default function HistoryLog({ history, assetChanges, currency }: HistoryLogProps) {
  const { hidden } = usePrivacy();

  const timeline = useMemo(() => {
    const items: TimelineItem[] = [];

    // Net worth entries with deltas
    for (let i = 0; i < history.length; i++) {
      const entry = history[i];
      const prev = history[i + 1];
      const delta = prev ? entry.totalValue - prev.totalValue : 0;
      const pct = prev && prev.totalValue > 0 ? (delta / prev.totalValue) * 100 : 0;
      items.push({ kind: "networth", entry, delta, pct });
    }

    // Asset change entries
    for (const entry of assetChanges) {
      items.push({ kind: "asset", entry });
    }

    // Sort newest first
    items.sort((a, b) => {
      const aDate = a.kind === "networth" ? a.entry.createdAt : a.entry.createdAt;
      const bDate = b.kind === "networth" ? b.entry.createdAt : b.entry.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    return items.slice(0, 20);
  }, [history, assetChanges]);

  if (timeline.length === 0) return null;

  return (
    <Card>
      <h2 className="mb-3 text-sm font-medium text-zinc-400">History</h2>
      <div className="space-y-2">
        {timeline.map((item, i) => {
          if (item.kind === "networth") {
            const { entry, delta, pct } = item;
            return (
              <div
                key={`nw-${entry.id ?? i}`}
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
                  {delta !== 0 && (
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
          }

          // Asset change entry
          const { entry } = item;
          const delta = entry.newValue - entry.oldValue;
          const pct = entry.oldValue > 0 ? (delta / entry.oldValue) * 100 : 0;

          return (
            <div
              key={`ac-${entry.id ?? i}`}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {entry.source === "auto" ? (
                  <RefreshCw className="h-4 w-4 shrink-0 text-blue-400" />
                ) : (
                  <Pencil className="h-4 w-4 shrink-0 text-amber-400" />
                )}
                <div className="min-w-0">
                  <span className="text-sm text-zinc-900 dark:text-white truncate block">
                    {entry.assetName}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {formatDate(entry.createdAt)}
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {hidden
                    ? HIDDEN_VALUE
                    : <>{formatCurrency(entry.oldValue, entry.currency)} → {formatCurrency(entry.newValue, entry.currency)}</>
                  }
                </span>
                <p className={`text-xs ${delta > 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {delta > 0 ? "+" : ""}{hidden ? "" : formatCurrency(delta, entry.currency)} ({pct > 0 ? "+" : ""}{pct.toFixed(1)}%)
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
