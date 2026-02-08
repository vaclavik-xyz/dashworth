"use client";

import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Asset, Category, Currency, HistoryEntry, AssetChangeEntry } from "@/types";
import { formatCurrency, formatDate, HIDDEN_VALUE } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import { COLOR_TEXT_MUTED_CLASSES } from "@/constants/colors";
import Card from "@/components/ui/Card";
import { usePrivacy } from "@/contexts/PrivacyContext";

type Tab = "networth" | "changes";

interface HistoryLogProps {
  history: HistoryEntry[];
  assetChanges: AssetChangeEntry[];
  assets: Asset[];
  categories: Category[];
  currency: Currency;
}

export default function HistoryLog({ history, assetChanges, assets, categories, currency }: HistoryLogProps) {
  const { hidden } = usePrivacy();
  const [tab, setTab] = useState<Tab>("networth");

  // Build lookup: assetId → category
  const assetCategoryMap = useMemo(() => {
    const catMap = new Map(categories.map((c) => [c.id, c]));
    const map = new Map<string, Category>();
    for (const a of assets) {
      const cat = catMap.get(a.categoryId);
      if (cat) map.set(a.id, cat);
    }
    return map;
  }, [assets, categories]);

  if (history.length === 0 && assetChanges.length === 0) return null;

  return (
    <Card>
      {/* Pill switcher */}
      <div className="mb-3 flex items-center gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/60">
        <button
          onClick={() => setTab("networth")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            tab === "networth"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Net Worth
          {history.length > 0 && (
            <span className={`ml-1.5 text-[10px] ${tab === "networth" ? "text-emerald-500" : "text-zinc-400"}`}>
              {history.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("changes")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            tab === "changes"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Changes
          {assetChanges.length > 0 && (
            <span className={`ml-1.5 text-[10px] ${tab === "changes" ? "text-emerald-500" : "text-zinc-400"}`}>
              {assetChanges.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="space-y-2">
        {tab === "networth" ? (
          history.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">No net worth history yet</p>
          ) : (
            history.slice(0, 20).map((entry, i) => {
              const prev = history[i + 1];
              const delta = prev ? entry.totalValue - prev.totalValue : 0;
              const pct = prev && prev.totalValue > 0 ? (delta / prev.totalValue) * 100 : 0;

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
                    {entry.source && (
                      <span className={`text-[10px] ${entry.source === "auto" ? "text-blue-400" : "text-zinc-500"}`}>
                        {entry.source}
                      </span>
                    )}
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
            })
          )
        ) : (
          assetChanges.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">No asset changes yet</p>
          ) : (
            assetChanges.slice(0, 20).map((entry, i) => {
              const delta = entry.newValue - entry.oldValue;
              const pct = entry.oldValue > 0 ? (delta / entry.oldValue) * 100 : 0;

              return (
                <div
                  key={entry.id ?? i}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {(() => {
                      const asset = assets.find((a) => a.id === entry.assetId);
                      const cat = assetCategoryMap.get(entry.assetId);
                      const Icon = getIcon(asset?.icon ?? cat?.icon ?? "box");
                      const colorClass = cat ? (COLOR_TEXT_MUTED_CLASSES[cat.color] ?? "text-zinc-400") : "text-zinc-400";
                      return <Icon className={`h-4 w-4 shrink-0 ${colorClass}`} />;
                    })()}
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
            })
          )
        )}
      </div>
    </Card>
  );
}
