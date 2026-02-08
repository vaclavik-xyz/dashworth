"use client";

import { useState } from "react";
import { ArrowLeft, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { EXAMPLE_PORTFOLIOS, type ExamplePortfolio } from "@/constants/example-portfolios";
import { db } from "@/lib/db";
import { uuid } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

/* ── Helpers ─────────────────────────────────────────── */

function formatUsd(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(value >= 10_000_000_000 ? 0 : 1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${value.toLocaleString("en-US")}`;
}

const PIE_COLORS = [
  "#10b981", "#3b82f6", "#f97316", "#a855f7", "#ef4444",
  "#f59e0b", "#06b6d4", "#ec4899", "#64748b", "#22c55e",
];

/* ── Mini Donut for cards ────────────────────────────── */

function MiniDonut({ assets, accentHex }: { assets: { name: string; percentage: number }[]; accentHex: string }) {
  const data = assets.map((a) => ({ name: a.name, value: a.percentage }));
  return (
    <div className="h-16 w-16 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={18}
            outerRadius={30}
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={i === 0 ? accentHex : PIE_COLORS[i % PIE_COLORS.length]}
                opacity={1 - i * 0.1}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Detail View ─────────────────────────────────────── */

function PortfolioDetail({ portfolio, onBack }: { portfolio: ExamplePortfolio; onBack: () => void }) {
  const latest = portfolio.snapshots[portfolio.snapshots.length - 1];
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  const chartData = portfolio.snapshots.map((s) => ({
    year: s.year.toString(),
    value: s.totalUsd,
  }));

  async function useAsTemplate() {
    setImporting(true);
    try {
      const categories = await db.categories.toArray();
      const catMap = new Map(categories.map((c) => [c.name, c.id]));

      // Ensure needed categories exist
      const needed = new Set(latest.assets.map((a) => a.category));
      for (const catName of needed) {
        if (!catMap.has(catName)) {
          const id = uuid();
          await db.categories.add({
            id,
            name: catName,
            icon: "box",
            color: "zinc",
            sortOrder: categories.length + 1,
            createdAt: new Date(),
          });
          catMap.set(catName, id);
        }
      }

      // Add assets with zero values
      const now = new Date();
      for (const asset of latest.assets) {
        const categoryId = catMap.get(asset.category) ?? catMap.get("Other") ?? "";
        await db.assets.add({
          id: uuid(),
          name: asset.name,
          categoryId,
          currency: "USD",
          currentValue: 0,
          priceSource: "manual",
          isArchived: false,
          createdAt: now,
          updatedAt: now,
        });
      }
      setImported(true);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to examples
      </button>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white ${portfolio.color}`}>
          {portfolio.initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{portfolio.name}</h1>
          <p className="text-sm text-zinc-500">{portfolio.description}</p>
        </div>
      </div>

      {/* Current Net Worth */}
      <Card className="mt-6">
        <p className="text-sm text-zinc-400">Current Net Worth</p>
        <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-1">{formatUsd(latest.totalUsd)}</p>
      </Card>

      {/* Line Chart */}
      <Card className="mt-4">
        <h2 className="mb-4 text-sm font-medium text-zinc-400">Net Worth Over Time</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--dw-grid)" />
            <XAxis
              dataKey="year"
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
              tickFormatter={(v: number) => formatUsd(v)}
              width={70}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--tooltip-bg, #18181b)",
                border: "1px solid var(--tooltip-border, #27272a)",
                borderRadius: "8px",
                fontSize: "13px",
                color: "var(--tooltip-text, #fafafa)",
              }}
              itemStyle={{ color: "var(--tooltip-text, #fafafa)" }}
              labelStyle={{ color: "var(--tooltip-label, #a1a1aa)" }}
              formatter={(value: number | undefined) => [formatUsd(value ?? 0), "Net Worth"]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={portfolio.accentHex}
              strokeWidth={2}
              dot={{ fill: portfolio.accentHex, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Current Allocation */}
      <Card className="mt-4">
        <h2 className="mb-4 text-sm font-medium text-zinc-400">Current Allocation</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="mx-auto sm:mx-0 h-44 w-44 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={latest.assets.map((a) => ({ name: a.name, value: a.percentage }))}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  strokeWidth={0}
                >
                  {latest.assets.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {latest.assets.map((asset, i) => (
              <div key={asset.name} className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400 flex-1 truncate">{asset.name}</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">{asset.percentage}%</span>
                <span className="text-xs text-zinc-500 w-16 text-right">{formatUsd(latest.totalUsd * asset.percentage / 100)}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <Card className="mt-4">
        <h2 className="mb-4 text-sm font-medium text-zinc-400">Timeline</h2>
        <div className="relative ml-3 border-l border-[var(--dw-border)]">
          {portfolio.snapshots.map((s, i) => {
            const prev = portfolio.snapshots[i - 1];
            const change = prev ? ((s.totalUsd - prev.totalUsd) / prev.totalUsd) * 100 : 0;
            const isGain = change >= 0;

            return (
              <div key={s.year} className="relative pl-6 pb-6 last:pb-0">
                <div
                  className="absolute -left-1.5 top-1 h-3 w-3 rounded-full border-2 border-[var(--dw-card)]"
                  style={{ backgroundColor: portfolio.accentHex }}
                />
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">{s.year}</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">{formatUsd(s.totalUsd)}</span>
                  {i > 0 && (
                    <span className={`text-xs font-medium ${isGain ? "text-emerald-500" : "text-red-400"}`}>
                      {isGain ? "+" : ""}{change.toFixed(0)}%
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">{s.label}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Use as Template */}
      <Card className="mt-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">Use as Template</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Import asset names and categories (without values) into your portfolio
            </p>
          </div>
          <Button
            onClick={useAsTemplate}
            disabled={importing || imported}
            variant={imported ? "secondary" : "primary"}
          >
            {imported ? "Imported!" : importing ? "Importing..." : "Use Template"}
          </Button>
        </div>
      </Card>

      {/* Disclaimer */}
      <p className="mt-6 text-xs text-zinc-600 text-center leading-relaxed px-4">
        All portfolio data is estimated based on public sources (Forbes, Bloomberg Billionaires Index).
        Actual allocations may differ significantly. This is for illustrative purposes only.
      </p>
    </div>
  );
}

/* ── Portfolio Card ──────────────────────────────────── */

function PortfolioCard({ portfolio, onClick }: { portfolio: ExamplePortfolio; onClick: () => void }) {
  const latest = portfolio.snapshots[portfolio.snapshots.length - 1];
  const first = portfolio.snapshots[0];
  const totalGrowth = ((latest.totalUsd - first.totalUsd) / first.totalUsd) * 100;

  return (
    <button
      onClick={onClick}
      className="w-full text-left"
    >
      <Card className="transition-colors hover:border-zinc-600">
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${portfolio.color}`}>
            {portfolio.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{portfolio.name}</p>
            <p className="text-xs text-zinc-500 truncate">{portfolio.description}</p>
          </div>
          <MiniDonut assets={latest.assets} accentHex={portfolio.accentHex} />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-lg font-bold text-zinc-900 dark:text-white">{formatUsd(latest.totalUsd)}</p>
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-500">
            <TrendingUp className="h-3.5 w-3.5" />
            +{totalGrowth.toFixed(0)}% since {first.year}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
          {latest.assets.slice(0, 3).map((a, i) => (
            <span key={a.name}>
              {i > 0 && <span className="text-zinc-600 mx-0.5">&middot;</span>}
              {a.name} {a.percentage}%
            </span>
          ))}
          {latest.assets.length > 3 && (
            <span className="text-zinc-600">+{latest.assets.length - 3} more</span>
          )}
        </div>
      </Card>
    </button>
  );
}

/* ── Examples Page ───────────────────────────────────── */

export default function ExamplesPage() {
  const [selected, setSelected] = useState<ExamplePortfolio | null>(null);

  return (
    <div className="p-6 md:p-10">
      {selected ? (
        <PortfolioDetail portfolio={selected} onBack={() => setSelected(null)} />
      ) : (
        <>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Example Portfolios</h1>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            Explore how famous people built their wealth over time. Click on any portfolio to see the full story.
          </p>

          <div className="mt-6 space-y-3">
            {EXAMPLE_PORTFOLIOS.map((p) => (
              <PortfolioCard key={p.id} portfolio={p} onClick={() => setSelected(p)} />
            ))}
          </div>

          <p className="mt-8 text-xs text-zinc-600 text-center leading-relaxed px-4">
            All portfolio data is estimated based on public sources (Forbes, Bloomberg Billionaires Index).
            Actual allocations may differ significantly. This is for illustrative purposes only.
          </p>
        </>
      )}
    </div>
  );
}
