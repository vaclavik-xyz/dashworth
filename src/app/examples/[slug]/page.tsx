"use client";

import { useState } from "react";
import { useExampleData } from "@/contexts/ExampleDataContext";
import { db } from "@/lib/db";
import { uuid } from "@/lib/utils";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import NetWorthHero from "@/components/dashboard/NetWorthHero";
import NetWorthChart from "@/components/dashboard/NetWorthChart";
import AllocationPie from "@/components/dashboard/AllocationPie";
import TopAssets from "@/components/dashboard/TopAssets";
import RecentActivity from "@/components/dashboard/RecentActivity";

const CAT_DEFAULTS: Record<string, { icon: string; color: string }> = {};
for (const cat of DEFAULT_CATEGORIES) {
  CAT_DEFAULTS[cat.name] = { icon: cat.icon, color: cat.color };
}

function formatUsd(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(value >= 10_000_000_000 ? 0 : 1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${value.toLocaleString("en-US")}`;
}

export default function ExampleDashboardPage() {
  const data = useExampleData();
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  if (!data) return <p className="text-zinc-500">Portfolio not found.</p>;

  const { portfolio, categories, assets, snapshots, currency, rates } = data;
  const latest = portfolio.snapshots[portfolio.snapshots.length - 1];
  const totalNetWorth = latest.totalUsd;

  async function useAsTemplate() {
    if (!data) return;
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
    <>
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

      <p className="mt-6 text-xs text-zinc-600 text-center leading-relaxed px-4">
        All portfolio data is estimated based on public sources (Forbes, Bloomberg Billionaires Index).
        Actual allocations may differ significantly. This is for illustrative purposes only.
      </p>
    </>
  );
}
