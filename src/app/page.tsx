"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { Wallet, Camera, BarChart3 } from "lucide-react";
import { db } from "@/lib/db";
import { useExchangeRates } from "@/lib/useExchangeRates";
import { sumConverted } from "@/lib/utils";
import type { Currency } from "@/types";
import NetWorthHero from "@/components/dashboard/NetWorthHero";
import NetWorthChart from "@/components/dashboard/NetWorthChart";
import AllocationPie from "@/components/dashboard/AllocationPie";
import TopAssets from "@/components/dashboard/TopAssets";
import RecentActivity from "@/components/dashboard/RecentActivity";
import SnapshotReminder from "@/components/layout/SnapshotReminder";

export default function DashboardPage() {
  const assets = useLiveQuery(() =>
    db.assets.filter((a) => !a.isArchived).toArray()
  );
  const categories = useLiveQuery(() => db.categories.toArray());
  const snapshots = useLiveQuery(() =>
    db.snapshots.orderBy("date").reverse().toArray()
  );
  const settings = useLiveQuery(() => db.settings.get("settings"));

  const { rates } = useExchangeRates();
  const currency: Currency = settings?.primaryCurrency ?? "CZK";
  const totalNetWorth = assets ? sumConverted(assets, currency, rates) : 0;
  const hasAssets = assets && assets.length > 0;
  const hasSnapshots = snapshots && snapshots.length > 0;

  // Onboarding state
  if (assets && snapshots && !hasAssets && !hasSnapshots) {
    return (
      <div className="p-6 md:p-10">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          dash<span className="text-emerald-500">Worth</span>
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Your wealth. Your data. Your dashboard.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            {
              step: 1,
              title: "Add your assets",
              description: "Track everything you own — crypto, stocks, real estate, and more.",
              icon: Wallet,
              href: "/assets",
            },
            {
              step: 2,
              title: "Take a snapshot",
              description: "Freeze your asset values at a point in time to build history.",
              icon: Camera,
              href: "/snapshots",
            },
            {
              step: 3,
              title: "Track your wealth",
              description: "Watch your net worth grow with charts and insights over time.",
              icon: BarChart3,
              href: "/",
            },
          ].map(({ step, title, description, icon: Icon, href }) => (
            <Link
              key={step}
              href={href}
              className="group rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-5 transition-colors hover:border-emerald-500/30"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 text-sm font-bold">
                {step}
              </div>
              <h3 className="mt-3 font-medium text-zinc-900 dark:text-white group-hover:text-emerald-400 transition-colors">
                {title}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">{description}</p>
              <Icon className="mt-3 h-5 w-5 text-zinc-600" />
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10">
      <SnapshotReminder />

      {/* Hero */}
      <NetWorthHero
        totalNetWorth={totalNetWorth}
        currency={currency}
        lastSnapshot={snapshots?.[0]}
        previousSnapshot={snapshots?.[1]}
      />

      {/* Charts */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {snapshots && (
          <NetWorthChart snapshots={snapshots} currency={currency} rates={rates} />
        )}
        {assets && categories && (
          <AllocationPie
            assets={assets}
            categories={categories}
            currency={currency}
            rates={rates}
          />
        )}
      </div>

      {/* Bottom sections */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {assets && categories && (
          <TopAssets assets={assets} categories={categories} currency={currency} rates={rates} />
        )}
        {snapshots && (
          <RecentActivity snapshots={snapshots} currency={currency} />
        )}
      </div>
    </div>
  );
}
