"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useExchangeRates } from "@/lib/useExchangeRates";
import { calcNetWorth } from "@/lib/utils";
import { useAutoHistory } from "@/hooks/useAutoHistory";
import type { Currency } from "@/types";
import NetWorthHero from "./NetWorthHero";
import NetWorthChart from "./NetWorthChart";
import AllocationPie from "./AllocationPie";
import TopAssets from "./TopAssets";
import HistoryLog from "./HistoryLog";
import InstallPrompt from "@/components/ui/InstallPrompt";
import HintTooltip from "@/components/ui/HintTooltip";

export default function DashboardView() {
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
  const breakdown = assets && categories ? calcNetWorth(assets, categories, currency, rates) : { totalAssets: 0, totalLiabilities: 0, netWorth: 0 };

  // Auto-record history when portfolio value changes
  useAutoHistory();

  // Still loading from IndexedDB
  if (assets === undefined || history === undefined) {
    return <div className="fixed inset-0 z-50 bg-[#09090b]" />;
  }

  return (
    <div className="p-6 md:p-10">
      <InstallPrompt />

      {/* Hero */}
      <div className="flex items-center gap-1">
        <HintTooltip text="Net worth is the total value of all your assets converted to your primary currency." />
      </div>
      <NetWorthHero
        totalAssets={breakdown.totalAssets}
        totalLiabilities={breakdown.totalLiabilities}
        netWorth={breakdown.netWorth}
        currency={currency}
        rates={rates}
        lastEntry={history?.[0]}
        previousEntry={history?.[1]}
      />

      {/* Row 1: Chart + Allocation */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {history && (
          <NetWorthChart history={history} currency={currency} rates={rates} />
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

      {/* Row 2: Top Assets + History */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {assets && categories && (
          <TopAssets assets={assets} categories={categories} currency={currency} rates={rates} />
        )}
        {history && assetChanges && assets && categories && (history.length > 0 || assetChanges.length > 0) && (
          <HistoryLog history={history} assetChanges={assetChanges} assets={assets} categories={categories} currency={currency} rates={rates} />
        )}
      </div>
    </div>
  );
}
