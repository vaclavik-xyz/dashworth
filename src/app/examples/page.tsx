"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { getIcon } from "@/lib/icons";
import { COLOR_BADGE_CLASSES } from "@/constants/colors";
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
import { useLiveQuery } from "dexie-react-hooks";
import {
  EXAMPLE_PORTFOLIOS,
  type ExampleCategory,
  type ExamplePortfolio,
  type ExampleSnapshot,
} from "@/constants/example-portfolios";
import { db } from "@/lib/db";
import { loadExamplePortfolio } from "@/lib/load-example";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ClientOnly from "@/components/ui/ClientOnly";

/* ── Helpers ─────────────────────────────────────────── */

function formatUsd(value: number): string {
  if (value >= 1_000_000_000)
    return `$${(value / 1_000_000_000).toFixed(value >= 10_000_000_000 ? 0 : 1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${value.toLocaleString("en-US")}`;
}

function formatUsdShort(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function getLiveTickers(portfolio: ExamplePortfolio): string[] {
  const latest = portfolio.snapshots[portfolio.snapshots.length - 1];
  return latest.assets.filter((a) => a.ticker).map((a) => a.ticker!);
}

const PIE_COLORS = [
  "#10b981", "#3b82f6", "#f97316", "#a855f7", "#ef4444",
  "#f59e0b", "#06b6d4", "#ec4899", "#64748b", "#22c55e",
];

/* ── Mini Donut ──────────────────────────────────────── */

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

/* ── Portfolio Card (grid view) ──────────────────────── */

function PortfolioCard({ portfolio, onClick }: { portfolio: ExamplePortfolio; onClick: () => void }) {
  const latest = portfolio.snapshots[portfolio.snapshots.length - 1];
  const first = portfolio.snapshots[0];
  const totalGrowth = ((latest.totalUsd - first.totalUsd) / first.totalUsd) * 100;
  const tickers = getLiveTickers(portfolio);

  return (
    <button onClick={onClick} className="w-full text-left cursor-pointer">
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
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-zinc-500 flex-wrap">
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
          {tickers.length > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-medium text-emerald-500/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {tickers.join(" · ")}
            </span>
          )}
        </div>
      </Card>
    </button>
  );
}

/* ── Detail: Net Worth Chart ─────────────────────────── */

function DetailChart({ snapshots, accentHex }: { snapshots: ExampleSnapshot[]; accentHex: string }) {
  const data = snapshots.map((s) => ({
    year: s.year.toString(),
    value: s.totalUsd,
  }));

  return (
    <Card>
      <h3 className="mb-4 text-sm font-medium text-zinc-400">Net Worth Over Time</h3>
      <ClientOnly>
        <ResponsiveContainer width="100%" height={250} minWidth={0}>
          <LineChart data={data}>
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
              tickFormatter={formatUsdShort}
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
              labelStyle={{ color: "var(--tooltip-label, #a1a1aa)" }}
              formatter={(value: number | undefined) => [formatUsd(value ?? 0), "Net Worth"]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={accentHex}
              strokeWidth={2}
              dot={{ fill: accentHex, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ClientOnly>
    </Card>
  );
}

/* ── Detail: Allocation Donut ────────────────────────── */

function DetailDonut({ snapshot, accentHex }: { snapshot: ExampleSnapshot; accentHex: string }) {
  const data = snapshot.assets.map((a) => ({
    name: a.name,
    value: (snapshot.totalUsd * a.percentage) / 100,
    pct: a.percentage,
  }));

  return (
    <Card>
      <h3 className="mb-4 text-sm font-medium text-zinc-400">Asset Allocation</h3>
      <ClientOnly>
        <ResponsiveContainer width="100%" height={250} minWidth={0}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={i === 0 ? accentHex : PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--tooltip-bg, #18181b)",
                border: "1px solid var(--tooltip-border, #27272a)",
                borderRadius: "8px",
                fontSize: "13px",
                color: "var(--tooltip-text, #fafafa)",
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, _: any, entry: any) => [
                `${formatUsd(Number(value) || 0)} (${entry?.payload?.pct ?? 0}%)`,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </ClientOnly>
      <div className="mt-2 space-y-1.5">
        {data.map((a, i) => (
          <div key={a.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: i === 0 ? accentHex : PIE_COLORS[i % PIE_COLORS.length] }}
              />
              <span className="text-zinc-300 truncate">{a.name}</span>
            </div>
            <span className="text-zinc-500 shrink-0 ml-2">{a.pct}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Detail: Asset List ──────────────────────────────── */

function DetailAssets({ snapshot, categories }: { snapshot: ExampleSnapshot; categories: ExampleCategory[] }) {
  const catMap = Object.fromEntries(categories.map((c) => [c.name, c]));

  return (
    <Card>
      <h3 className="mb-4 text-sm font-medium text-zinc-400">Assets</h3>
      <div className="space-y-3">
        {snapshot.assets.map((a) => {
          const value = (snapshot.totalUsd * a.percentage) / 100;
          const cat = catMap[a.category];
          const Icon = cat ? getIcon(cat.icon) : null;
          const badgeClass = cat ? COLOR_BADGE_CLASSES[cat.color] ?? "" : "";
          const sourceLabel =
            a.priceSource === "yahoo"
              ? `Yahoo Finance (${a.ticker})`
              : a.priceSource === "coingecko"
                ? `CoinGecko (${a.ticker})`
                : null;

          return (
            <div key={a.name} className="flex items-center justify-between gap-3">
              {Icon && (
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${badgeClass}`}>
                  <Icon className="h-4 w-4" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{a.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-zinc-500">{a.category}</span>
                  {sourceLabel && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-500/80">
                      <Zap className="h-2.5 w-2.5" />
                      {sourceLabel}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-white">{formatUsd(value)}</p>
                <p className="text-xs text-zinc-500">{a.percentage}%</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── Detail: Timeline ────────────────────────────────── */

function DetailTimeline({ snapshots }: { snapshots: ExampleSnapshot[] }) {
  return (
    <Card>
      <h3 className="mb-4 text-sm font-medium text-zinc-400">Timeline</h3>
      <div className="relative ml-3 border-l border-zinc-700 pl-6 space-y-6">
        {[...snapshots].reverse().map((s, i, arr) => {
          const prev = i < arr.length - 1 ? arr[i + 1] : null;
          const change = prev
            ? ((s.totalUsd - prev.totalUsd) / prev.totalUsd) * 100
            : null;
          const isUp = change !== null && change >= 0;

          return (
            <div key={s.year} className="relative">
              <span className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full border-2 border-zinc-700 bg-zinc-900" />
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">{s.year}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">{formatUsd(s.totalUsd)}</span>
                  {change !== null && (
                    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isUp ? "text-emerald-500" : "text-red-400"}`}>
                      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {isUp ? "+" : ""}{change.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">{s.label}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── Detail View ─────────────────────────────────────── */

function PortfolioDetail({
  portfolio,
  onBack,
  onTry,
}: {
  portfolio: ExamplePortfolio;
  onBack: () => void;
  onTry: () => void;
}) {
  const latest = portfolio.snapshots[portfolio.snapshots.length - 1];
  const first = portfolio.snapshots[0];
  const totalGrowth = ((latest.totalUsd - first.totalUsd) / first.totalUsd) * 100;

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        All examples
      </button>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white ${portfolio.color}`}>
          {portfolio.initials}
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{portfolio.name}</h2>
          <p className="text-sm text-zinc-500">{portfolio.description}</p>
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-3">
        <p className="text-3xl font-bold text-zinc-900 dark:text-white">{formatUsd(latest.totalUsd)}</p>
        <span className="flex items-center gap-1 text-sm font-medium text-emerald-500">
          <TrendingUp className="h-4 w-4" />
          +{totalGrowth.toFixed(0)}% since {first.year}
        </span>
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <DetailChart snapshots={portfolio.snapshots} accentHex={portfolio.accentHex} />
        <DetailDonut snapshot={latest} accentHex={portfolio.accentHex} />
      </div>

      {/* Assets + Timeline */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <DetailAssets snapshot={latest} categories={portfolio.categories} />
        <DetailTimeline snapshots={portfolio.snapshots} />
      </div>

      {/* Try this portfolio */}
      <Card className="mt-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">Try this portfolio</p>
            <p className="text-xs text-zinc-500">
              Load {portfolio.name}&apos;s portfolio into your dashboard to explore the full app experience.
            </p>
          </div>
          <Button onClick={onTry} className="shrink-0">
            Load Portfolio
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ── Examples Page ───────────────────────────────────── */

export default function ExamplesPage() {
  const router = useRouter();
  const settings = useLiveQuery(() => db.settings.get("settings"));
  const assetCount = useLiveQuery(() => db.assets.count());

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ExamplePortfolio | null>(null);
  const [loading, setLoading] = useState(false);

  const isSampleData = settings?.isSampleData === true;
  const hasRealData = !isSampleData && (assetCount ?? 0) > 0;

  const selectedPortfolio = selectedId
    ? EXAMPLE_PORTFOLIOS.find((p) => p.id === selectedId) ?? null
    : null;

  async function doLoad(portfolio: ExamplePortfolio) {
    setLoading(true);
    try {
      await loadExamplePortfolio(portfolio);
      router.push("/");
    } finally {
      setLoading(false);
    }
  }

  function handleTry(portfolio: ExamplePortfolio) {
    if (hasRealData) {
      setConfirmTarget(portfolio);
      return;
    }
    doLoad(portfolio);
  }

  // Detail view
  if (selectedPortfolio) {
    return (
      <div className="p-6 md:p-10">
        <PortfolioDetail
          portfolio={selectedPortfolio}
          onBack={() => setSelectedId(null)}
          onTry={() => handleTry(selectedPortfolio)}
        />

        <p className="mt-8 text-xs text-zinc-600 text-center leading-relaxed px-4">
          All portfolio data is estimated based on public sources (Forbes, Bloomberg Billionaires Index).
          Actual allocations may differ significantly. This is for illustrative purposes only.
        </p>

        {/* Confirm replace modal */}
        <Modal
          open={confirmTarget !== null && !loading}
          onClose={() => setConfirmTarget(null)}
          title="Load Example Portfolio"
        >
          <p className="text-sm text-zinc-400">
            Load <span className="font-medium text-zinc-900 dark:text-white">{confirmTarget?.name}</span>&apos;s portfolio?
            This will <span className="text-red-400 font-medium">replace your current data</span> (assets, snapshots, and categories).
          </p>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setConfirmTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => confirmTarget && doLoad(confirmTarget)} disabled={loading}>
              {loading ? "Loading..." : "Replace My Data"}
            </Button>
          </div>
        </Modal>

        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="text-center">
              <div className="animate-pulse text-lg font-bold text-white">Loading portfolio...</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Grid view
  return (
    <div className="p-6 md:p-10">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Example Portfolios</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Explore how famous people built their wealth over time. Tap to see the full breakdown.
      </p>

      <div className="mt-6 space-y-3">
        {EXAMPLE_PORTFOLIOS.map((p) => (
          <PortfolioCard key={p.id} portfolio={p} onClick={() => setSelectedId(p.id)} />
        ))}
      </div>

      <p className="mt-8 text-xs text-zinc-600 text-center leading-relaxed px-4">
        All portfolio data is estimated based on public sources (Forbes, Bloomberg Billionaires Index).
        Actual allocations may differ significantly. This is for illustrative purposes only.
      </p>
    </div>
  );
}
