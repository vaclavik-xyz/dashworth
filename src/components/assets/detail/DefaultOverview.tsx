"use client";

import {
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
import type { Asset, Category, Currency, HistoryEntry } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { convertCurrency } from "@/lib/exchange-rates";
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

interface DefaultOverviewProps {
  assets: Asset[];
  categories: Category[];
  history: HistoryEntry[];
  currency: Currency;
  rates: Record<string, number>;
}

export default function DefaultOverview({ assets, categories, history, currency, rates }: DefaultOverviewProps) {
  const { ref: pieRef, width: pieWidth } = useContainerWidth();
  const { ref: lineRef, width: lineWidth } = useContainerWidth();
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

  // Line chart data: net worth over time from history
  const lineData = [...history]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((h) => ({
      date: new Date(h.createdAt).toLocaleDateString("cs-CZ", { day: "numeric", month: "short" }),
      value: h.totalValue,
    }));

  const pieSize = Math.min(pieWidth, 180);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-zinc-400">Portfolio Overview</h3>
      </div>

      {pieData.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-medium text-zinc-500">Allocation by Category</h4>
          <div ref={pieRef} className="flex justify-center">
            {pieWidth > 0 && (
              <PieChart width={pieSize} height={pieSize}>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={pieSize * 0.22}
                  outerRadius={pieSize * 0.36}
                  strokeWidth={0}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                  formatter={(value: number | undefined) => formatCurrency(value ?? 0, currency)}
                />
              </PieChart>
            )}
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
          <div ref={lineRef}>
            {lineWidth > 0 && (
              <LineChart width={lineWidth} height={160} data={lineData}>
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
