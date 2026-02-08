"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { EXAMPLE_PORTFOLIOS, type ExamplePortfolio } from "@/constants/example-portfolios";
import Card from "@/components/ui/Card";
import ClientOnly from "@/components/ui/ClientOnly";

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
      <ClientOnly>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={18} outerRadius={30} strokeWidth={0}>
              {data.map((_, i) => (
                <Cell key={i} fill={i === 0 ? accentHex : PIE_COLORS[i % PIE_COLORS.length]} opacity={1 - i * 0.1} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </ClientOnly>
    </div>
  );
}

/* ── Portfolio Card ──────────────────────────────────── */

function PortfolioCard({ portfolio }: { portfolio: ExamplePortfolio }) {
  const latest = portfolio.snapshots[portfolio.snapshots.length - 1];
  const first = portfolio.snapshots[0];
  const totalGrowth = ((latest.totalUsd - first.totalUsd) / first.totalUsd) * 100;

  return (
    <Link href={`/examples/${portfolio.id}`} className="block">
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
    </Link>
  );
}

/* ── Examples Page ───────────────────────────────────── */

export default function ExamplesPage() {
  return (
    <div className="p-6 md:p-10">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Example Portfolios</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Explore how famous people built their wealth over time. Click on any portfolio to see their Dashworth.
      </p>

      <div className="mt-6 space-y-3">
        {EXAMPLE_PORTFOLIOS.map((p) => (
          <PortfolioCard key={p.id} portfolio={p} />
        ))}
      </div>

      <p className="mt-8 text-xs text-zinc-600 text-center leading-relaxed px-4">
        All portfolio data is estimated based on public sources (Forbes, Bloomberg Billionaires Index).
        Actual allocations may differ significantly. This is for illustrative purposes only.
      </p>
    </div>
  );
}
