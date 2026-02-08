"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { Asset, Category, Currency, Snapshot } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { convertCurrency } from "@/lib/exchange-rates";
import { getIcon } from "@/lib/icons";
import { COLOR_HEX } from "@/constants/colors";
import { useContainerWidth } from "@/hooks/useContainerWidth";

const tooltipStyle = {
  backgroundColor: "var(--tooltip-bg, #18181b)",
  border: "1px solid var(--tooltip-border, #27272a)",
  borderRadius: "8px",
  fontSize: "13px",
  color: "var(--tooltip-text, #fafafa)",
};

const tooltipItemStyle = { color: "var(--tooltip-text, #fafafa)" };

interface AssetDetailProps {
  asset: Asset;
  category: Category | undefined;
  snapshots: Snapshot[];
  currency: Currency;
  rates: Record<string, number>;
}

export default function AssetDetail({ asset, category, snapshots, currency, rates }: AssetDetailProps) {
  const { ref, width } = useContainerWidth();
  const Icon = category ? getIcon(category.icon) : null;
  const catColor = COLOR_HEX[category?.color ?? "zinc"] ?? COLOR_HEX.zinc;

  // Line chart: find entry with matching assetId in each snapshot, plot value over time
  const lineData = [...snapshots]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((s) => {
      const entry = s.entries.find((e) => e.assetId === asset.id);
      if (!entry) return null;
      return {
        date: new Date(s.date).toLocaleDateString("cs-CZ", { day: "numeric", month: "short" }),
        value: convertCurrency(entry.value, entry.currency, currency, rates),
      };
    })
    .filter((d): d is { date: string; value: number } => d !== null);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5" style={{ color: catColor }} />}
          <h3 className="text-sm font-medium text-zinc-900 dark:text-white">{asset.name}</h3>
        </div>
        <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">
          {formatCurrency(asset.currentValue, asset.currency)}
        </p>
        <div className="mt-2 space-y-1 text-xs text-zinc-500">
          <p>Category: <span className="text-zinc-700 dark:text-zinc-300">{category?.name ?? "Unknown"}</span></p>
          {asset.group && (
            <p>Group: <span className="text-zinc-700 dark:text-zinc-300">{asset.group}</span></p>
          )}
          <p>Currency: <span className="text-zinc-700 dark:text-zinc-300">{asset.currency}</span></p>
          <p>Updated: <span className="text-zinc-700 dark:text-zinc-300">{formatDate(asset.updatedAt)}</span></p>
        </div>
        {asset.notes && (
          <p className="mt-3 rounded-lg bg-[var(--dw-hover)] p-3 text-xs text-zinc-600 dark:text-zinc-400">
            {asset.notes}
          </p>
        )}
      </div>

      {lineData.length >= 2 && (
        <div>
          <h4 className="mb-2 text-xs font-medium text-zinc-500">Value Over Time</h4>
          <div ref={ref}>
            {width > 0 && (
              <LineChart width={width} height={160} data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--dw-grid)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  className="[&_.recharts-text]:fill-zinc-500"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  className="[&_.recharts-text]:fill-zinc-500"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => formatCurrency(v, currency)}
                  width={80}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                  labelStyle={{ color: "var(--tooltip-label, #a1a1aa)" }}
                  formatter={(value: number | undefined) => [formatCurrency(value ?? 0, currency), asset.name]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={catColor}
                  strokeWidth={2}
                  dot={{ fill: catColor, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
