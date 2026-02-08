"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useExchangeRates } from "@/lib/useExchangeRates";
import { sumConverted } from "@/lib/utils";
import type { Currency } from "@/types";
import LandingPage from "@/components/landing/LandingPage";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import NetWorthHero from "@/components/dashboard/NetWorthHero";
import NetWorthChart from "@/components/dashboard/NetWorthChart";
import AllocationPie from "@/components/dashboard/AllocationPie";
import TopAssets from "@/components/dashboard/TopAssets";
import HistoryLog from "@/components/dashboard/HistoryLog";
import InstallPrompt from "@/components/ui/InstallPrompt";
import HintTooltip from "@/components/ui/HintTooltip";

type View = "landing" | "onboarding" | "dashboard";

export default function DashboardPage() {
  const [view, setView] = useState<View>("landing");

  const assets = useLiveQuery(() =>
    db.assets.filter((a) => !a.isArchived).toArray()
  );
  const categories = useLiveQuery(() => db.categories.toArray());
  const history = useLiveQuery(() =>
    db.history.orderBy("createdAt").reverse().toArray()
  );
  const assetChanges = useLiveQuery(() =>
    db.assetChanges.orderBy("createdAt").reverse().toArray()
  );
  const settings = useLiveQuery(() => db.settings.get("settings"));

  const { rates } = useExchangeRates();
  const currency: Currency = settings?.primaryCurrency ?? "CZK";
  const totalNetWorth = assets ? sumConverted(assets, currency, rates) : 0;
  const hasAssets = assets && assets.length > 0;

  // Still loading from IndexedDB — show branded splash
  if (assets === undefined || history === undefined) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090b]">
        <div className="animate-pulse text-center">
          <h1 className="text-3xl font-bold text-white">
            Dash<span className="text-emerald-500">worth</span>
          </h1>
        </div>
      </div>
    );
  }

  // New user flow
  if (!hasAssets) {
    if (view === "onboarding") {
      return <OnboardingWizard onComplete={() => setView("dashboard")} />;
    }
    return <LandingPage onStart={() => setView("onboarding")} />;
  }

  return (
    <div className="p-6 md:p-10">
      <InstallPrompt />

      {/* Hero */}
      <div className="flex items-center gap-1">
        <HintTooltip text="Net worth is the total value of all your assets converted to your primary currency." />
      </div>
      <NetWorthHero
        totalNetWorth={totalNetWorth}
        currency={currency}
        lastEntry={history?.[0]}
        previousEntry={history?.[1]}
      />

      {/* Charts */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {history && (
          <NetWorthChart history={history} currency={currency} />
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
        {history && assetChanges && (history.length > 0 || assetChanges.length > 0) && (
          <HistoryLog history={history} assetChanges={assetChanges} currency={currency} />
        )}
      </div>
    </div>
  );
}
