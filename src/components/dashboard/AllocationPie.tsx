"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import type { Asset, Category, Currency } from "@/types";
import { formatCurrency } from "@/lib/utils";
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

interface AllocationPieProps {
  assets: Asset[];
  categories: Category[];
  currency: Currency;
}

export default function AllocationPie({ assets, categories, currency }: AllocationPieProps) {
  if (assets.length === 0) return null;

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const grouped = new Map<string, { name: string; value: number; color: string }>();
  for (const asset of assets) {
    const cat = categoryMap.get(asset.categoryId);
    const key = asset.categoryId;
    const existing = grouped.get(key);
    if (existing) {
      existing.value += asset.currentValue;
    } else {
      grouped.set(key, {
        name: cat?.name ?? "Other",
        value: asset.currentValue,
        color: COLOR_HEX[cat?.color ?? "zinc"] ?? COLOR_HEX.zinc,
      });
    }
  }

  const data = [...grouped.values()].filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  if (data.length === 0) return null;

  return (
    <Card>
      <h2 className="mb-4 text-sm font-medium text-zinc-400">
        Asset Allocation
      </h2>
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
