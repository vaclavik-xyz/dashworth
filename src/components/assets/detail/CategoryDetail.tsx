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
import { getIcon } from "@/lib/icons";
import { COLOR_HEX } from "@/constants/colors";

const ASSET_COLORS = [
  "#10b981", "#3b82f6", "#f97316", "#a855f7", "#ef4444",
  "#22c55e", "#f59e0b", "#ec4899", "#06b6d4", "#64748b",
];

const tooltipStyle = {
  backgroundColor: "var(--tooltip-bg, #18181b)",
  border: "1px solid var(--tooltip-border, #27272a)",
  borderRadius: "8px",
  fontSize: "13px",
  color: "var(--tooltip-text, #fafafa)",
};

const tooltipItemStyle = { color: "var(--tooltip-text, #fafafa)" };

interface CategoryDetailProps {
  categoryId: string;
  category: Category | undefined;
  assets: Asset[];
  snapshots: Snapshot[];
  currency: Currency;
  rates: Record<string, number>;
}

export default function CategoryDetail({ categoryId, category, assets, snapshots, currency, rates }: CategoryDetailProps) {
  const Icon = category ? getIcon(category.icon) : null;
  const catColor = COLOR_HEX[category?.color ?? "zinc"] ?? COLOR_HEX.zinc;
  const total = assets.reduce((sum, a) => sum + convertCurrency(a.currentValue, a.currency, currency, rates), 0);

  // Line chart: sum of entries with matching categoryId per snapshot
  const lineData = [...snapshots]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((s) => {
      const catTotal = s.entries
        .filter((e) => e.categoryId === categoryId)
        .reduce((sum, e) => sum + convertCurrency(e.value, e.currency, currency, rates), 0);
      return {
        date: new Date(s.date).toLocaleDateString("cs-CZ", { day: "numeric", month: "short" }),
        value: catTotal,
      };
    })
    .filter((d) => d.value > 0);

  // Donut: allocation of assets within the category
  const donutData = assets
    .filter((a) => a.currentValue > 0)
    .map((a) => ({
      name: a.name,
      value: convertCurrency(a.currentValue, a.currency, currency, rates),
    }))
    .sort((a, b) => b.value - a.value)
    .map((a, i) => ({
      ...a,
      color: ASSET_COLORS[i % ASSET_COLORS.length],
    }));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5" style={{ color: catColor }} />}
          <h3 className="text-sm font-medium text-zinc-900 dark:text-white">
            {category?.name ?? "Unknown"}
          </h3>
        </div>
        <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">
          {formatCurrency(total, currency)}
        </p>
        <p className="text-xs text-zinc-500">{assets.length} {assets.length === 1 ? "asset" : "assets"}</p>
      </div>

      {lineData.length >= 2 && (
        <div>
          <h4 className="mb-2 text-xs font-medium text-zinc-500">Value Over Time</h4>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={lineData}>
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
                formatter={(value: number | undefined) => [formatCurrency(value ?? 0, currency), category?.name ?? "Value"]}
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

      {donutData.length > 1 && (
        <div>
          <h4 className="mb-2 text-xs font-medium text-zinc-500">Asset Allocation</h4>
          <div className="h-[150px] md:h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                strokeWidth={0}
              >
                {donutData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                formatter={(value: number | undefined) => formatCurrency(value ?? 0, currency)}
              />
            </PieChart>
          </ResponsiveContainer>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {donutData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-zinc-600 dark:text-zinc-400">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
