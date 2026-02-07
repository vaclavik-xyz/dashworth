"use client";

import { useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import type { Asset, Category, Currency } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { convertCurrency } from "@/lib/exchange-rates";
import Card from "@/components/ui/Card";

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

// Distinct colors for groups when not tied to a category color
const GROUP_COLORS = [
  "#f97316", "#3b82f6", "#10b981", "#a855f7", "#ef4444",
  "#22c55e", "#64748b", "#f59e0b", "#ec4899", "#06b6d4",
];

interface AllocationPieProps {
  assets: Asset[];
  categories: Category[];
  currency: Currency;
  rates: Record<string, number>;
}

type ViewMode = "categories" | "groups";

export default function AllocationPie({ assets, categories, currency, rates }: AllocationPieProps) {
  const [view, setView] = useState<ViewMode>("categories");

  if (assets.length === 0) return null;

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  function buildCategoryData() {
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
  }

  function buildGroupData() {
    const grouped = new Map<string, { name: string; value: number }>();
    for (const asset of assets) {
      const key = asset.group ?? asset.name;
      const converted = convertCurrency(asset.currentValue, asset.currency, currency, rates);
      const existing = grouped.get(key);
      if (existing) {
        existing.value += converted;
      } else {
        grouped.set(key, { name: key, value: converted });
      }
    }
    const sorted = [...grouped.values()].filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
    return sorted.map((d, i) => ({ ...d, color: GROUP_COLORS[i % GROUP_COLORS.length] }));
  }

  const data = view === "categories" ? buildCategoryData() : buildGroupData();
  if (data.length === 0) return null;

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-400">
          Asset Allocation
        </h2>
        <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs overflow-hidden">
          <button
            type="button"
            onClick={() => setView("categories")}
            className={`px-2.5 py-1 transition-colors ${
              view === "categories"
                ? "bg-emerald-500/10 text-emerald-500 font-medium"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Categories
          </button>
          <button
            type="button"
            onClick={() => setView("groups")}
            className={`px-2.5 py-1 transition-colors ${
              view === "groups"
                ? "bg-emerald-500/10 text-emerald-500 font-medium"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Groups
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--tooltip-bg, #18181b)",
              border: "1px solid var(--tooltip-border, #27272a)",
              borderRadius: "8px",
              fontSize: "13px",
              color: "var(--tooltip-text, #fafafa)",
            }}
            formatter={(value: number | undefined) => formatCurrency(value ?? 0, currency)}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-zinc-600 dark:text-zinc-400">{d.name}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
