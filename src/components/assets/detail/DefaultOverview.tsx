"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { Asset, Category, Currency, Snapshot } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { convertCurrency } from "@/lib/exchange-rates";

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

interface DefaultOverviewProps {
  assets: Asset[];
  categories: Category[];
  snapshots: Snapshot[];
  currency: Currency;
  rates: Record<string, number>;
}

export default function DefaultOverview({ assets, categories, snapshots, currency, rates }: DefaultOverviewProps) {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Pie chart data: allocation by category
  const pieData = (() => {
    const grouped = new Map<string, { name: string; value: number; color: string }>();
    for (const asset of assets) {
      const cat = categoryMap.get(asset.categoryId);
      const key = asset.categoryId;
      const converted = convertCurrency(asset.currentValue, asset.currency, currency, rates);
      const existing = grouped.get(key);
      if (existing) {
        existing.value += converted;
      } else {
        grouped.set(key, {
          name: cat?.name ?? "Other",
          value: converted,
          color: COLOR_HEX[cat?.color ?? "zinc"] ?? COLOR_HEX.zinc,
        });
      }
    }
    return [...grouped.values()].filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  })();

  // Line chart data: net worth over time from snapshots (converted to primary currency)
  const lineData = [...snapshots]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((s) => ({
      date: new Date(s.date).toLocaleDateString("cs-CZ", { day: "numeric", month: "short" }),
      value: s.entries.reduce(
        (sum, e) => sum + convertCurrency(e.value, e.currency, currency, rates),
        0,
      ),
    }));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-zinc-400">Portfolio Overview</h3>
      </div>

      {pieData.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-medium text-zinc-500">Allocation by Category</h4>
          <div className="h-[150px] md:h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                strokeWidth={0}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number | undefined) => formatCurrency(value ?? 0, currency)}
              />
            </PieChart>
          </ResponsiveContainer>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-zinc-600 dark:text-zinc-400">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {lineData.length >= 2 && (
        <div>
          <h4 className="mb-2 text-xs font-medium text-zinc-500">Net Worth Over Time</h4>
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
                formatter={(value: number | undefined) => [formatCurrency(value ?? 0, currency), "Net Worth"]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
