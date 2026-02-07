"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { Currency, Snapshot } from "@/types";
import { formatCurrency } from "@/lib/utils";
import Card from "@/components/ui/Card";

interface NetWorthChartProps {
  snapshots: Snapshot[];
  currency: Currency;
}

export default function NetWorthChart({ snapshots, currency }: NetWorthChartProps) {
  if (snapshots.length < 2) return null;

  const data = [...snapshots]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((s) => ({
      date: new Date(s.date).toLocaleDateString("cs-CZ", {
        day: "numeric",
        month: "short",
      }),
      value: s.totalNetWorth,
    }));

  return (
    <Card>
      <h2 className="mb-4 text-sm font-medium text-zinc-400">
        Net Worth Over Time
      </h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#71717a" }}
            axisLine={{ stroke: "#27272a" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#71717a" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => formatCurrency(v, currency)}
            width={90}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
              borderRadius: "8px",
              fontSize: "13px",
            }}
            labelStyle={{ color: "#a1a1aa" }}
            formatter={(value: number | undefined) => [
              formatCurrency(value ?? 0, currency),
              "Net Worth",
            ]}
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
    </Card>
  );
}
