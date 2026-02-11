"use client";

import type { Asset, Category, Currency, Goal, HistoryEntry } from "@/types";
import { formatCurrency, getGoalCurrentValue, HIDDEN_VALUE } from "@/lib/utils";
import { convertCurrency } from "@/lib/exchange-rates";
import Card from "@/components/ui/Card";

interface GoalProgressProps {
  goal: Goal;
  currentNetWorth: number;
  currency: Currency;
  rates: Record<string, number>;
  history: HistoryEntry[];
  hidden: boolean;
  assets: Asset[];
  categories: Category[];
}

export default function GoalProgress({
  goal,
  currentNetWorth,
  currency,
  rates,
  history,
  hidden,
  assets,
  categories,
}: GoalProgressProps) {
  const { amount: goalAmount, currency: goalCurrency, date: goalDate, name: goalName } = goal;
  const goalInPrimary = goalCurrency && goalCurrency !== currency
    ? convertCurrency(goalAmount, goalCurrency, currency, rates)
    : goalAmount;

  const isLinked = !!goal.linkType;
  const currentValue = getGoalCurrentValue(goal, assets, categories, currentNetWorth, currency, rates);
  const brokenLink = currentValue === null;

  // Resolve linked item name for subtitle
  const linkLabel = (() => {
    if (!goal.linkType || !goal.linkId) return null;
    if (goal.linkType === "asset") {
      const asset = assets.find((a) => a.id === goal.linkId);
      return asset ? asset.name : null;
    }
    const cat = categories.find((c) => c.id === goal.linkId);
    return cat ? cat.name : null;
  })();

  const effectiveValue = currentValue ?? 0;
  const pct = goalInPrimary > 0 ? Math.min((effectiveValue / goalInPrimary) * 100, 100) : 0;
  const reached = !brokenLink && effectiveValue >= goalInPrimary;

  // Projection: average daily change from last 30+ days of history
  // Disabled for linked goals (history only stores total net worth)
  const projection = (() => {
    if (isLinked || brokenLink || reached) return null;
    if (history.length < 2) return null;

    const sorted = [...history].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const recent = sorted.filter((e) => new Date(e.createdAt).getTime() >= thirtyDaysAgo);
    const entries = recent.length >= 2 ? recent : sorted;

    if (entries.length < 2) return null;

    const first = entries[0];
    const last = entries[entries.length - 1];
    const firstVal = convertCurrency(first.totalValue, first.currency, currency, rates);
    const lastVal = convertCurrency(last.totalValue, last.currency, currency, rates);
    const days =
      (new Date(last.createdAt).getTime() - new Date(first.createdAt).getTime()) /
      (1000 * 60 * 60 * 24);

    if (days < 1) return null;

    const avgDailyChange = (lastVal - firstVal) / days;
    if (avgDailyChange <= 0) return { type: "negative" as const };

    const remaining = goalInPrimary - effectiveValue;
    const daysToGoal = remaining / avgDailyChange;
    const projectedDate = new Date(now + daysToGoal * 24 * 60 * 60 * 1000);

    return { type: "projected" as const, date: projectedDate, daysToGoal: Math.ceil(daysToGoal) };
  })();

  // On-track indicator — disabled for linked goals
  const onTrack = (() => {
    if (isLinked || brokenLink || !goalDate || reached) return null;

    const targetDate = new Date(goalDate);
    const now = new Date();
    const totalDays = (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (totalDays <= 0) return { behind: true, label: "Past target date" };

    if (history.length < 1) return null;

    const sorted = [...history].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const startVal = convertCurrency(sorted[0].totalValue, sorted[0].currency, currency, rates);
    const totalGrowthNeeded = goalInPrimary - startVal;

    if (totalGrowthNeeded <= 0) return null;

    const startDate = new Date(sorted[0].createdAt);
    const totalTimespan = targetDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();

    if (totalTimespan <= 0) return null;

    const expectedProgress = elapsed / totalTimespan;
    const expectedValue = startVal + totalGrowthNeeded * expectedProgress;
    const behind = effectiveValue < expectedValue;

    return { behind, label: behind ? "Behind schedule" : "On track" };
  })();

  const milestones = [25, 50, 75];

  function formatShortDate(d: Date): string {
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  // Broken link state
  if (brokenLink) {
    return (
      <Card className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{goalName}</p>
          <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
            Link broken
          </span>
        </div>
        <p className="text-xs text-zinc-500">
          The linked {goal.linkType} was deleted. Edit this goal in Settings to fix.
        </p>
        <div className="mt-2 flex items-end justify-between">
          <span className="text-sm text-zinc-500">—</span>
          <span className="text-sm font-medium text-zinc-900 dark:text-white">
            {hidden ? HIDDEN_VALUE : formatCurrency(goalInPrimary, currency)}
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{goalName}</p>
          {isLinked && linkLabel && (
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Tracking: {linkLabel}
            </p>
          )}
        </div>
        {reached && (
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
            Reached!
          </span>
        )}
        {!reached && onTrack && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              onTrack.behind
                ? "bg-amber-500/10 text-amber-400"
                : "bg-emerald-500/10 text-emerald-400"
            }`}
          >
            {onTrack.label}
          </span>
        )}
      </div>

      {/* Current / Goal values */}
      <div className="flex items-end justify-between mb-2">
        <span className="text-sm text-zinc-400">
          {hidden ? HIDDEN_VALUE : formatCurrency(effectiveValue, currency)}
        </span>
        <span className="text-sm font-medium text-zinc-900 dark:text-white">
          {hidden ? HIDDEN_VALUE : formatCurrency(goalInPrimary, currency)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
            reached ? "bg-emerald-400" : "bg-emerald-500"
          }`}
          style={{ width: `${pct}%` }}
        />
        {/* Milestone markers */}
        {milestones.map((m) => (
          <div
            key={m}
            className="absolute inset-y-0 w-px bg-zinc-600"
            style={{ left: `${m}%` }}
          />
        ))}
      </div>

      {/* Percentage */}
      <div className="mt-1.5">
        <span className="text-xs font-medium text-emerald-400">{pct.toFixed(0)}%</span>
      </div>

      {/* Projection / target info */}
      {goalDate && !reached && (
        <p className="mt-2 text-xs text-zinc-500">
          Target: {new Date(goalDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      )}
      {!goalDate && projection?.type === "projected" && (
        <p className="mt-2 text-xs text-zinc-500">
          Projected: {formatShortDate(projection.date)} (~{projection.daysToGoal} days)
        </p>
      )}
      {!goalDate && projection?.type === "negative" && (
        <p className="mt-2 text-xs text-zinc-500">
          Net worth trending down — no projection available
        </p>
      )}
      {reached && (
        <p className="mt-2 text-xs text-emerald-400">
          You&apos;ve reached your goal!
        </p>
      )}
    </Card>
  );
}
