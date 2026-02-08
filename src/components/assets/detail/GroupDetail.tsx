"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { Asset, Currency, Snapshot } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { convertCurrency } from "@/lib/exchange-rates";
import { useContainerWidth } from "@/hooks/useContainerWidth";

const tooltipStyle = {
  backgroundColor: "var(--tooltip-bg, #18181b)",
  border: "1px solid var(--tooltip-border, #27272a)",
  borderRadius: "8px",
  fontSize: "13px",
  color: "var(--tooltip-text, #fafafa)",
};

const tooltipItemStyle = { color: "var(--tooltip-text, #fafafa)" };

interface GroupDetailProps {
  group: string;
  categoryId: string;
  assets: Asset[];
  snapshots: Snapshot[];
  currency: Currency;
  rates: Record<string, number>;
}

export default function GroupDetail({ group, categoryId, assets, snapshots, currency, rates }: GroupDetailProps) {
  const { ref, width } = useContainerWidth();
  const total = assets.reduce((sum, a) => sum + convertCurrency(a.currentValue, a.currency, currency, rates), 0);

  // Line chart: sum of entries with matching group + categoryId per snapshot
  const lineData = [...snapshots]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((s) => {
      const groupTotal = s.entries
        .filter((e) => e.categoryId === categoryId && e.group === group)
        .reduce((sum, e) => sum + convertCurrency(e.value, e.currency, currency, rates), 0);
      return {
        date: new Date(s.date).toLocaleDateString("cs-CZ", { day: "numeric", month: "short" }),
        value: groupTotal,
      };
    })
    .filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-zinc-900 dark:text-white">{group}</h3>
        <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">
          {formatCurrency(total, currency)}
        </p>
        <p className="text-xs text-zinc-500">{assets.length} {assets.length === 1 ? "asset" : "assets"}</p>
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
                  formatter={(value: number | undefined) => [formatCurrency(value ?? 0, currency), group]}
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

      <div>
        <h4 className="mb-2 text-xs font-medium text-zinc-500">Assets</h4>
        <div className="space-y-2">
          {assets
            .map((asset) => ({
              asset,
              converted: convertCurrency(asset.currentValue, asset.currency, currency, rates),
            }))
            .sort((a, b) => b.converted - a.converted)
            .map(({ asset, converted }) => (
              <div key={asset.id} className="flex items-center justify-between rounded-lg bg-[var(--dw-hover)] px-3 py-2">
                <span className="text-sm text-zinc-900 dark:text-white">{asset.name}</span>
                <div className="text-right">
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    {formatCurrency(converted, currency)}
                  </span>
                  {total > 0 && (
                    <span className="ml-2 text-xs text-zinc-500">
                      {((converted / total) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
