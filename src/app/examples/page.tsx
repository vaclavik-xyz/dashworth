"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { EXAMPLE_PORTFOLIOS, type ExamplePortfolio } from "@/constants/example-portfolios";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import { db } from "@/lib/db";
import { uuid } from "@/lib/utils";
import type { Asset, Category, Snapshot, SnapshotEntry, Currency } from "@/types";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import NetWorthHero from "@/components/dashboard/NetWorthHero";
import NetWorthChart from "@/components/dashboard/NetWorthChart";
import AllocationPie from "@/components/dashboard/AllocationPie";
import TopAssets from "@/components/dashboard/TopAssets";
import RecentActivity from "@/components/dashboard/RecentActivity";

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

/** Map category names to DEFAULT_CATEGORIES color/icon, fall back to "Other" */
const CAT_DEFAULTS: Record<string, { icon: string; color: string }> = {};
for (const cat of DEFAULT_CATEGORIES) {
  CAT_DEFAULTS[cat.name] = { icon: cat.icon, color: cat.color };
}

/** Build synthetic Category[], Asset[], Snapshot[] from an ExamplePortfolio */
function buildSyntheticData(portfolio: ExamplePortfolio) {
  const currency: Currency = "USD";
  const rates: Record<string, number> = { USD: 1, EUR: 0.92, CZK: 23.5 };

  // Build categories from the unique category names across all snapshots
  const catNames = new Set<string>();
  for (const snap of portfolio.snapshots) {
    for (const a of snap.assets) catNames.add(a.category);
  }

  const categories: Category[] = [...catNames].map((name, i) => ({
    id: `cat-${name}`,
    name,
    icon: CAT_DEFAULTS[name]?.icon ?? "box",
    color: CAT_DEFAULTS[name]?.color ?? "zinc",
    sortOrder: i,
    createdAt: new Date(2020, 0, 1),
  }));

  // Build assets from the latest snapshot
  const latest = portfolio.snapshots[portfolio.snapshots.length - 1];
  const assets: Asset[] = latest.assets.map((a, i) => ({
    id: `asset-${i}`,
    name: a.name,
    categoryId: `cat-${a.category}`,
    currency,
    currentValue: (latest.totalUsd * a.percentage) / 100,
    priceSource: "manual" as const,
    isArchived: false,
    createdAt: new Date(2020, 0, 1),
    updatedAt: new Date(),
  }));

  // Build snapshots from the historical data
  const snapshots: Snapshot[] = portfolio.snapshots.map((s, i) => {
    const entries: SnapshotEntry[] = s.assets.map((a, j) => ({
      assetId: `asset-${j}`,
      assetName: a.name,
      categoryId: `cat-${a.category}`,
      value: (s.totalUsd * a.percentage) / 100,
      currency,
    }));

    return {
      id: `snap-${i}`,
      date: new Date(s.year, 5, 15), // June 15 of each year
      entries,
      totalNetWorth: s.totalUsd,
      primaryCurrency: currency,
      note: s.label,
      createdAt: new Date(s.year, 5, 15),
    };
  });

  // Reverse for display (newest first, like the real app)
  const snapshotsDesc = [...snapshots].reverse();

  return { categories, assets, snapshots: snapshotsDesc, currency, rates };
}

/* ── Mini Donut for cards ────────────────────────────── */

function MiniDonut({ assets, accentHex }: { assets: { name: string; percentage: number }[]; accentHex: string }) {
  const data = assets.map((a) => ({ name: a.name, value: a.percentage }));
  return (
    <div className="h-16 w-16 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={18} outerRadius={30} strokeWidth={0}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === 0 ? accentHex : PIE_COLORS[i % PIE_COLORS.length]} opacity={1 - i * 0.1} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Detail: Real Dashboard ──────────────────────────── */

function PortfolioDetail({ portfolio, onBack }: { portfolio: ExamplePortfolio; onBack: () => void }) {
  const { categories, assets, snapshots, currency, rates } = useMemo(
    () => buildSyntheticData(portfolio),
    [portfolio],
  );

  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  const latest = portfolio.snapshots[portfolio.snapshots.length - 1];
  const totalNetWorth = latest.totalUsd;

  async function useAsTemplate() {
    setImporting(true);
    try {
      const existingCats = await db.categories.toArray();
      const catMap = new Map(existingCats.map((c) => [c.name, c.id]));

      const needed = new Set(latest.assets.map((a) => a.category));
      for (const catName of needed) {
        if (!catMap.has(catName)) {
          const id = uuid();
          await db.categories.add({
            id,
            name: catName,
            icon: CAT_DEFAULTS[catName]?.icon ?? "box",
            color: CAT_DEFAULTS[catName]?.color ?? "zinc",
            sortOrder: existingCats.length + 1,
            createdAt: new Date(),
          });
          catMap.set(catName, id);
        }
      }

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

      {/* Person header */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white ${portfolio.color}`}>
          {portfolio.initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{portfolio.name}</h1>
          <p className="text-sm text-zinc-500">{portfolio.description}</p>
        </div>
      </div>

      {/* Real dashboard components */}
      <NetWorthHero
        totalNetWorth={totalNetWorth}
        currency={currency}
        lastSnapshot={snapshots[0]}
        previousSnapshot={snapshots[1]}
      />

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <NetWorthChart snapshots={snapshots} currency={currency} rates={rates} />
        <AllocationPie assets={assets} categories={categories} currency={currency} rates={rates} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <TopAssets assets={assets} categories={categories} currency={currency} rates={rates} />
        <RecentActivity snapshots={snapshots} currency={currency} />
      </div>

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
                <div className="flex items-baseline gap-2 flex-wrap">
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
    <button onClick={onClick} className="w-full text-left">
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
        <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500 flex-wrap">
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
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Example Portfolios</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Explore how famous people built their wealth over time. Click on any portfolio to see their Dashworth.
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
