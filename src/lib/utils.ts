import type { Asset, Category, Currency, Goal } from "@/types";
import { convertCurrency } from "@/lib/exchange-rates";

export interface NetWorthBreakdown {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

export function calcNetWorth(
  assets: Asset[],
  categories: Category[],
  targetCurrency: Currency,
  rates: Record<string, number>,
): NetWorthBreakdown {
  const liabilityIds = new Set(categories.filter((c) => c.isLiability).map((c) => c.id));
  let totalAssets = 0;
  let totalLiabilities = 0;

  for (const a of assets) {
    const converted = convertCurrency(a.currentValue, a.currency, targetCurrency, rates);
    if (liabilityIds.has(a.categoryId)) {
      totalLiabilities += converted;
    } else {
      totalAssets += converted;
    }
  }

  return { totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities };
}

export function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID (older mobile browsers)
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16),
  );
}

const CURRENCY_LOCALE: Record<Currency, string> = {
  CZK: "cs-CZ",
  EUR: "de-DE",
  USD: "en-US",
};

export const HIDDEN_VALUE = "•••••";

export function formatCurrency(value: number, currency: Currency): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("cs-CZ", { day: "numeric", month: "short", year: "numeric" });
}

export function getGoalCurrentValue(
  goal: Goal,
  assets: Asset[],
  categories: Category[],
  netWorth: number,
  currency: Currency,
  rates: Record<string, number>,
): number | null {
  if (goal.linkType === "asset" && goal.linkId) {
    const asset = assets.find((a) => a.id === goal.linkId);
    if (!asset) return null;
    return convertCurrency(asset.currentValue, asset.currency, currency, rates);
  }
  if (goal.linkType === "category" && goal.linkId) {
    if (!categories.find((c) => c.id === goal.linkId)) return null;
    return sumConverted(
      assets.filter((a) => a.categoryId === goal.linkId),
      currency,
      rates,
    );
  }
  return netWorth;
}

export function sumConverted(
  assets: Asset[],
  targetCurrency: Currency,
  rates: Record<string, number>,
): number {
  return assets.reduce(
    (sum, a) => sum + convertCurrency(a.currentValue, a.currency, targetCurrency, rates),
    0,
  );
}
