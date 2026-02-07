"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { Asset, Category, Currency, Snapshot } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getIcon } from "@/lib/icons";

const COLOR_HEX: Record<string, string> = {
  orange: "#f97316",
  blue: "#3b82f6",
  emerald: "#10b981",
  purple: "#a855f7",
  red: "#ef4444",
  green: "#22c55e",
  slate: "#64748b",
  amber: "#f59e0b",
  zinc: "#71717a",
};

const tooltipStyle = {
  backgroundColor: "var(--tooltip-bg, #18181b)",
  border: "1px solid var(--tooltip-border, #27272a)",
  borderRadius: "8px",
  fontSize: "13px",
  color: "var(--tooltip-text, #fafafa)",
};

interface AssetDetailProps {
  asset: Asset;
  category: Category | undefined;
  snapshots: Snapshot[];
  currency: Currency;
}

export default function AssetDetail({ asset, category, snapshots, currency }: AssetDetailProps) {
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
        value: entry.value,
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
          <p className="mt-3 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400">
            {asset.notes}
          </p>
        )}
      </div>

      {lineData.length >= 2 && (
        <div>
          <h4 className="mb-2 text-xs font-medium text-zinc-500">Value Over Time</h4>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" className="[&>line]:stroke-zinc-200 dark:[&>line]:stroke-zinc-800" stroke="#e4e4e7" />
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
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
