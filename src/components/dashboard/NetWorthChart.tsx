"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
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

  const sorted = [...history].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  // Single entry — show placeholder with dot + baseline
  if (sorted.length < 2) {
    const value = sorted[0]?.totalValue ?? 0;
    return (
      <Card>
        <h2 className="mb-4 text-sm font-medium text-zinc-400">
          Net Worth Over Time
        </h2>
        <div ref={ref} className="overflow-hidden">
          {width > 0 && (
            <LineChart
              width={width}
              height={200}
              data={[{ idx: 0, value }, { idx: 1, value }]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--dw-grid)" />
              <XAxis hide />
              <YAxis hide domain={[(value * 0.9) || 0, (value * 1.1) || 100]} />
              <ReferenceLine y={value} stroke="#10b981" strokeDasharray="6 4" strokeOpacity={0.4} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="transparent"
                dot={(_props: Record<string, unknown>) => {
                  const { cx, cy, index } = _props as { cx: number; cy: number; index: number };
                  if (index !== 0) return <circle key="hidden" r={0} />;
                  return (
                    <circle
                      key="dot"
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill="#10b981"
                      stroke="#065f46"
                      strokeWidth={2}
                    />
                  );
                }}
              />
            </LineChart>
          )}
        </div>
        <p className="mt-3 text-center text-xs text-zinc-500">
          Your chart will grow as your portfolio changes
        </p>
      </Card>
    );
  }

  const firstDate = new Date(sorted[0].createdAt);
  const lastDate = new Date(sorted[sorted.length - 1].createdAt);
  const spansYears = lastDate.getFullYear() - firstDate.getFullYear() >= 1;
  const manyPoints = sorted.length > 20;

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Every entry is a separate equidistant point with unique index
  const data = sorted.map((h, i) => {
    const d = new Date(h.createdAt);
    const mon = MONTHS[d.getMonth()];
    const yr = String(d.getFullYear()).slice(2);
    const day = d.getDate();
    return {
      idx: i,
      tickLabel: spansYears ? `${mon} ${yr}` : `${day} ${mon}`,
      fullLabel: `${day} ${mon} ${d.getFullYear()}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`,
      value: h.totalValue,
    };
  });

  // Fewer ticks on narrow screens to prevent overlap
  const maxTicks = Math.min(data.length, width < 400 ? 3 : width < 600 ? 5 : 7);

  return (
    <Card>
      <h2 className="mb-4 text-sm font-medium text-zinc-400">
        Net Worth Over Time
      </h2>
      <div ref={ref} className="overflow-hidden">
        {width > 0 && (
          <LineChart width={width} height={250} data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--dw-grid)" />
            <XAxis
              dataKey="idx"
              type="number"
              domain={[0, data.length - 1]}
              tick={{ fontSize: 12 }}
              className="[&_.recharts-text]:fill-zinc-500"
              axisLine={{ stroke: "var(--dw-grid)" }}
              tickLine={false}
              tickCount={maxTicks}
              tickFormatter={(idx: number) => data[idx]?.tickLabel ?? ""}
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
              allowEscapeViewBox={{ x: false, y: false }}
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
