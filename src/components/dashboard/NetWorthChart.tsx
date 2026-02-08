"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { Currency, HistoryEntry } from "@/types";
import { formatCurrency, HIDDEN_VALUE } from "@/lib/utils";
import Card from "@/components/ui/Card";
import { useContainerWidth } from "@/hooks/useContainerWidth";
import { usePrivacy } from "@/contexts/PrivacyContext";

interface NetWorthChartProps {
  history: HistoryEntry[];
  currency: Currency;
}

export default function NetWorthChart({ history, currency }: NetWorthChartProps) {
  const { ref, width } = useContainerWidth();
  const { hidden } = usePrivacy();

  if (history.length < 2) return null;

  const sorted = [...history].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const firstDate = new Date(sorted[0].createdAt);
  const lastDate = new Date(sorted[sorted.length - 1].createdAt);
  const spansYears = lastDate.getFullYear() - firstDate.getFullYear() >= 1;
  const manyPoints = sorted.length > 20;

  // Every entry is a separate equidistant point
  const data = sorted.map((h) => {
    const d = new Date(h.createdAt);
    return {
      label: spansYears
        ? d.toLocaleDateString("cs-CZ", { month: "short", year: "2-digit" })
        : d.toLocaleDateString("cs-CZ", { day: "numeric", month: "short" }),
      fullLabel: d.toLocaleDateString("cs-CZ", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }),
      value: h.totalValue,
    };
  });

  // Show ~6-8 evenly spaced ticks
  const tickInterval = Math.max(1, Math.floor(data.length / 7)) - 1;

  return (
    <Card>
      <h2 className="mb-4 text-sm font-medium text-zinc-400">
        Net Worth Over Time
      </h2>
      <div ref={ref}>
        {width > 0 && (
          <LineChart width={width} height={250} data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--dw-grid)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              className="[&_.recharts-text]:fill-zinc-500"
              axisLine={{ stroke: "var(--dw-grid)" }}
              tickLine={false}
              interval={tickInterval}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="[&_.recharts-text]:fill-zinc-500"
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => hidden ? HIDDEN_VALUE : formatCurrency(v, currency)}
              width={90}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--tooltip-bg, #18181b)",
                border: "1px solid var(--tooltip-border, #27272a)",
                borderRadius: "8px",
                fontSize: "13px",
                color: "var(--tooltip-text, #fafafa)",
              }}
              labelStyle={{ color: "var(--tooltip-label, #a1a1aa)" }}
              labelFormatter={(_label, payload) => {
                const item = payload?.[0]?.payload;
                return item?.fullLabel ?? _label;
              }}
              formatter={(value: number | undefined) => [hidden ? HIDDEN_VALUE : formatCurrency(value ?? 0, currency), "Net Worth"]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              dot={manyPoints ? false : { fill: "#10b981", r: 4 }}
              activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2, fill: "#065f46" }}
            />
          </LineChart>
        )}
      </div>
    </Card>
  );
}
