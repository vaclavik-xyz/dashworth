"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Pencil, RefreshCw } from "lucide-react";
import type { Asset, AssetChangeEntry, Category, Currency } from "@/types";
import { formatCurrency, formatDate, HIDDEN_VALUE } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import { COLOR_HEX } from "@/constants/colors";
import { useContainerWidth } from "@/hooks/useContainerWidth";
import { usePrivacy } from "@/contexts/PrivacyContext";
import PriceSourceBadge from "@/components/ui/PriceSourceBadge";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface AssetDetailProps {
  asset: Asset;
  category: Category | undefined;
  changes: AssetChangeEntry[];
  currency: Currency;
  rates: Record<string, number>;
}

export default function AssetDetail({ asset, category, changes }: AssetDetailProps) {
  const { hidden } = usePrivacy();
  const { ref, width } = useContainerWidth();
  const Icon = getIcon(asset.icon ?? category?.icon ?? "box");
  const catColor = COLOR_HEX[category?.color ?? "zinc"] ?? COLOR_HEX.zinc;

  // Build chart data from changes (oldest first) + current value
  const chartData = useMemo(() => {
    if (changes.length === 0) return [];

    // changes are newest-first from the query
    const sorted = [...changes].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    const points: { idx: number; tickLabel: string; fullLabel: string; value: number }[] = [];
    let idx = 0;

    // Add the initial value before first change
    const firstDate = new Date(sorted[0].createdAt);
    points.push({
      idx: idx++,
      tickLabel: `${firstDate.getDate()} ${MONTHS[firstDate.getMonth()]}`,
      fullLabel: formatFullLabel(firstDate),
      value: sorted[0].oldValue,
    });

    // Add each change's new value
    for (const c of sorted) {
      const d = new Date(c.createdAt);
      points.push({
        idx: idx++,
        tickLabel: `${d.getDate()} ${MONTHS[d.getMonth()]}`,
        fullLabel: formatFullLabel(d),
        value: c.newValue,
      });
    }

    // If the current value differs from the last change, add current
    const lastPoint = points[points.length - 1];
    if (lastPoint && Math.round(lastPoint.value) !== Math.round(asset.currentValue)) {
      const now = new Date(asset.updatedAt);
      points.push({
        idx: idx++,
        tickLabel: `${now.getDate()} ${MONTHS[now.getMonth()]}`,
        fullLabel: formatFullLabel(now),
        value: asset.currentValue,
      });
    }

    return points;
  }, [changes, asset.currentValue, asset.updatedAt]);

  const manyPoints = chartData.length > 10;
  const maxTicks = Math.min(chartData.length, width < 300 ? 3 : 5);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5" style={{ color: catColor }} />
          <h3 className="text-sm font-medium text-zinc-900 dark:text-white">{asset.name}</h3>
        </div>
        <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">
          {hidden ? HIDDEN_VALUE : formatCurrency(asset.currentValue, asset.currency)}
        </p>
        <div className="mt-2 space-y-1 text-xs text-zinc-500">
          <p>Category: <span className="text-zinc-700 dark:text-zinc-300">{category?.name ?? "Unknown"}</span></p>
          {asset.group && (
            <p>Group: <span className="text-zinc-700 dark:text-zinc-300">{asset.group}</span></p>
          )}
          <p>Currency: <span className="text-zinc-700 dark:text-zinc-300">{asset.currency}</span></p>
          <p className="flex items-center gap-1">
            Price source:{" "}
            <span className="inline-flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
              {asset.priceSource === "coingecko" ? "CoinGecko" : asset.priceSource === "yahoo" ? "Yahoo Finance" : "Manual"}
              <PriceSourceBadge source={asset.priceSource} size="sm" />
            </span>
          </p>
          <p>Updated: <span className="text-zinc-700 dark:text-zinc-300">{formatDate(asset.updatedAt)}{", "}{new Date(asset.updatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span></p>
        </div>
        {asset.notes && (
          <p className="mt-3 rounded-lg bg-[var(--dw-hover)] p-3 text-xs text-zinc-600 dark:text-zinc-400">
            {asset.notes}
          </p>
        )}
      </div>

      {/* Value chart */}
      {chartData.length >= 2 && (
        <div>
          <h4 className="mb-2 text-xs font-medium text-zinc-400">Value Over Time</h4>
          <div ref={ref} className="overflow-hidden">
            {width > 0 && (
              <LineChart width={width} height={160} data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--dw-grid)" />
                <XAxis
                  dataKey="idx"
                  type="number"
                  domain={[0, chartData.length - 1]}
                  tick={{ fontSize: 10 }}
                  className="[&_.recharts-text]:fill-zinc-500"
                  axisLine={{ stroke: "var(--dw-grid)" }}
                  tickLine={false}
                  tickCount={maxTicks}
                  tickFormatter={(idx: number) => chartData[idx]?.tickLabel ?? ""}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  className="[&_.recharts-text]:fill-zinc-500"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    hidden ? HIDDEN_VALUE : formatCurrency(v, asset.currency)
                  }
                  width={70}
                />
                <Tooltip
                  allowEscapeViewBox={{ x: false, y: false }}
                  contentStyle={{
                    backgroundColor: "var(--tooltip-bg, #18181b)",
                    border: "1px solid var(--tooltip-border, #27272a)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "var(--tooltip-text, #fafafa)",
                  }}
                  labelStyle={{ color: "var(--tooltip-label, #a1a1aa)" }}
                  labelFormatter={(_label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item?.fullLabel ?? _label;
                  }}
                  formatter={(value: number | undefined) => [
                    hidden ? HIDDEN_VALUE : formatCurrency(value ?? 0, asset.currency),
                    "Value",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={catColor}
                  strokeWidth={2}
                  dot={manyPoints ? false : { fill: catColor, r: 3 }}
                  activeDot={{ r: 5, stroke: catColor, strokeWidth: 2, fill: "#18181b" }}
                />
              </LineChart>
            )}
          </div>
        </div>
      )}

      {/* Changes timeline */}
      {changes.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-medium text-zinc-400">
            Changes
            <span className="ml-1.5 text-[10px] text-emerald-500">{changes.length}</span>
          </h4>
          <div className="space-y-1.5">
            {changes.slice(0, 20).map((entry, i) => {
              const delta = entry.newValue - entry.oldValue;
              const pct = entry.oldValue > 0 ? (delta / entry.oldValue) * 100 : 0;

              return (
                <div
                  key={entry.id ?? i}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {delta > 0 ? (
                      <TrendingUp className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    ) : delta < 0 ? (
                      <TrendingDown className="h-3.5 w-3.5 shrink-0 text-red-500" />
                    ) : (
                      <Minus className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-zinc-500 truncate">
                          {formatDate(entry.createdAt)}
                        </span>
                        {entry.source === "auto"
                          ? <RefreshCw className="h-2.5 w-2.5 text-blue-400/60" />
                          : <Pencil className="h-2.5 w-2.5 text-zinc-500/60" />
                        }
                      </div>
                      <span className="text-[10px] text-zinc-500 block">
                        {new Date(entry.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {entry.note && (
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 italic truncate block">
                          {entry.note}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xs font-medium text-zinc-900 dark:text-white">
                      {hidden ? HIDDEN_VALUE : formatCurrency(entry.newValue, entry.currency)}
                    </span>
                    {delta !== 0 && (
                      <p className={`text-[10px] ${delta > 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {delta > 0 ? "+" : ""}
                        {hidden ? "" : formatCurrency(delta, entry.currency)}{" "}
                        ({pct > 0 ? "+" : ""}{pct.toFixed(1)}%)
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {changes.length === 0 && (
        <p className="text-xs text-zinc-500 text-center py-2">No changes recorded yet</p>
      )}
    </div>
  );
}

function formatFullLabel(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}
