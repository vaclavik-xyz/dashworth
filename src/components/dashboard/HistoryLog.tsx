"use client";

import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Minus, Pencil, RefreshCw } from "lucide-react";
import type { Asset, Category, Currency, HistoryEntry, AssetChangeEntry } from "@/types";
import { formatCurrency, formatDate, HIDDEN_VALUE } from "@/lib/utils";
import { convertCurrency } from "@/lib/exchange-rates";
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
  rates: Record<string, number>;
}

export default function HistoryLog({ history, assetChanges, assets, categories, currency, rates }: HistoryLogProps) {
  const { hidden } = usePrivacy();
  const [tab, setTab] = useState<Tab>("networth");
  const [showAllNetWorth, setShowAllNetWorth] = useState(false);
  const [showAllChanges, setShowAllChanges] = useState(false);
  const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
  const initialCount = isDesktop ? 5 : 3;

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
      <div>
        {tab === "networth" ? (
          history.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">No net worth history yet</p>
          ) : (<>
            <div className="space-y-2 md:max-h-[400px] md:overflow-y-auto md:pr-2 md:[scrollbar-width:thin] md:[scrollbar-color:theme(colors.zinc.600)_transparent]">
              {(isDesktop ? history : showAllNetWorth ? history : history.slice(0, initialCount)).map((entry, i) => {
                const prev = history[i + 1];
                const val = convertCurrency(entry.totalValue, entry.currency, currency, rates);
                const prevVal = prev ? convertCurrency(prev.totalValue, prev.currency, currency, rates) : 0;
                const delta = prev ? val - prevVal : 0;
                const pct = prev && prevVal > 0 ? (delta / prevVal) * 100 : 0;

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
                        entry.source === "auto"
                          ? <RefreshCw className="h-3 w-3 text-blue-400/60" />
                          : <Pencil className="h-3 w-3 text-zinc-500/60" />
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">
                        {hidden ? HIDDEN_VALUE : formatCurrency(val, currency)}
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
            {!isDesktop && history.length > initialCount && (
              <button
                type="button"
                onClick={() => setShowAllNetWorth(!showAllNetWorth)}
                className="w-full py-3 text-sm text-zinc-400 hover:text-zinc-200 text-center transition-colors"
              >
                {showAllNetWorth ? "Show less" : `Show all ${history.length} entries`}
              </button>
            )}
          </>)
        ) : (
          assetChanges.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">No asset changes yet</p>
          ) : (<>
            <div className="space-y-2 md:max-h-[400px] md:overflow-y-auto md:pr-2 md:[scrollbar-width:thin] md:[scrollbar-color:theme(colors.zinc.600)_transparent]">
              {(isDesktop ? assetChanges : showAllChanges ? assetChanges : assetChanges.slice(0, initialCount)).map((entry, i) => {
                const cvOld = convertCurrency(entry.oldValue, entry.currency, currency, rates);
                const cvNew = convertCurrency(entry.newValue, entry.currency, currency, rates);
                const delta = cvNew - cvOld;
                const pct = cvOld > 0 ? (delta / cvOld) * 100 : 0;

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
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          {formatDate(entry.createdAt)}
                          {entry.source === "auto"
                            ? <RefreshCw className="h-3 w-3 text-blue-400/60" />
                            : <Pencil className="h-3 w-3 text-zinc-500/60" />
                          }
                        </span>
                        {entry.note && (
                          <span className="text-xs text-zinc-400 dark:text-zinc-500 italic truncate block">
                            {entry.note}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">
                        {hidden
                          ? HIDDEN_VALUE
                          : <>{formatCurrency(cvOld, currency)} → {formatCurrency(cvNew, currency)}</>
                        }
                      </span>
                      <p className={`text-xs ${delta > 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {delta > 0 ? "+" : ""}{hidden ? "" : formatCurrency(delta, currency)} ({pct > 0 ? "+" : ""}{pct.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            {!isDesktop && assetChanges.length > initialCount && (
              <button
                type="button"
                onClick={() => setShowAllChanges(!showAllChanges)}
                className="w-full py-3 text-sm text-zinc-400 hover:text-zinc-200 text-center transition-colors"
              >
                {showAllChanges ? "Show less" : `Show all ${assetChanges.length} changes`}
              </button>
            )}
          </>)
        )}
      </div>
    </Card>
  );
}
