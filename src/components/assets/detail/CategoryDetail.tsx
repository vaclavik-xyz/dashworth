"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import type { Asset, Category, Currency } from "@/types";
import { formatCurrency, HIDDEN_VALUE } from "@/lib/utils";
import { convertCurrency } from "@/lib/exchange-rates";
import { getIcon } from "@/lib/icons";
import { COLOR_HEX } from "@/constants/colors";
import { useContainerWidth } from "@/hooks/useContainerWidth";
import { usePrivacy } from "@/contexts/PrivacyContext";

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
  category: Category | undefined;
  assets: Asset[];
  currency: Currency;
  rates: Record<string, number>;
}

export default function CategoryDetail({ category, assets, currency, rates }: CategoryDetailProps) {
  const { ref: pieRef, width: pieWidth } = useContainerWidth();
  const { hidden } = usePrivacy();
  const Icon = category ? getIcon(category.icon) : null;
  const catColor = COLOR_HEX[category?.color ?? "zinc"] ?? COLOR_HEX.zinc;
  const total = assets.reduce((sum, a) => sum + convertCurrency(a.currentValue, a.currency, currency, rates), 0);

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

  const pieSize = Math.min(pieWidth, 180);

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
          {hidden ? HIDDEN_VALUE : formatCurrency(total, currency)}
        </p>
        <p className="text-xs text-zinc-500">{assets.length} {assets.length === 1 ? "asset" : "assets"}</p>
      </div>

      {donutData.length > 1 && (
        <div>
          <h4 className="mb-2 text-xs font-medium text-zinc-500">Asset Allocation</h4>
          <div ref={pieRef} className="flex justify-center">
            {pieWidth > 0 && (
              <PieChart width={pieSize} height={pieSize}>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={pieSize * 0.22}
                  outerRadius={pieSize * 0.36}
                  strokeWidth={0}
                >
                  {donutData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                  formatter={(value: number | undefined) => hidden ? HIDDEN_VALUE : formatCurrency(value ?? 0, currency)}
                />
              </PieChart>
            )}
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
