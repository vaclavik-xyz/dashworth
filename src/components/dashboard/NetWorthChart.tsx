"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { Currency, Snapshot } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { convertCurrency } from "@/lib/exchange-rates";
import Card from "@/components/ui/Card";
import { useContainerWidth } from "@/hooks/useContainerWidth";

interface NetWorthChartProps {
  snapshots: Snapshot[];
  currency: Currency;
  rates: Record<string, number>;
}

export default function NetWorthChart({ snapshots, currency, rates }: NetWorthChartProps) {
  const { ref, width } = useContainerWidth();

  if (snapshots.length < 2) return null;

  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const firstYear = new Date(sorted[0].date).getFullYear();
  const lastYear = new Date(sorted[sorted.length - 1].date).getFullYear();
  const spansYears = lastYear - firstYear >= 1;

  const data = sorted.map((s) => {
    const d = new Date(s.date);
    return {
      date: spansYears
        ? d.getFullYear().toString()
        : d.toLocaleDateString("cs-CZ", { day: "numeric", month: "short" }),
      value: s.entries.reduce(
        (sum, e) => sum + convertCurrency(e.value, e.currency, currency, rates),
        0,
      ),
    };
  });

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
              dataKey="date"
              tick={{ fontSize: 12 }}
              className="[&_.recharts-text]:fill-zinc-500"
              axisLine={{ stroke: "var(--dw-grid)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="[&_.recharts-text]:fill-zinc-500"
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => formatCurrency(v, currency)}
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
              formatter={(value: number | undefined) => [formatCurrency(value ?? 0, currency), "Net Worth"]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: "#10b981", r: 4 }}
              activeDot={{ r: 7, stroke: "#10b981", strokeWidth: 2, fill: "#065f46" }}
            />
          </LineChart>
        )}
      </div>
    </Card>
  );
}
