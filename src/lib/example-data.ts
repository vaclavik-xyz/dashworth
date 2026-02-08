import { EXAMPLE_PORTFOLIOS, type ExamplePortfolio } from "@/constants/example-portfolios";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import type { Asset, Category, Snapshot, SnapshotEntry, Currency } from "@/types";

/** Map category names to DEFAULT_CATEGORIES color/icon */
const CAT_DEFAULTS: Record<string, { icon: string; color: string }> = {};
for (const cat of DEFAULT_CATEGORIES) {
  CAT_DEFAULTS[cat.name] = { icon: cat.icon, color: cat.color };
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export interface ExampleData {
  portfolio: ExamplePortfolio;
  categories: Category[];
  assets: Asset[];
  snapshots: Snapshot[];
  currency: Currency;
  rates: Record<string, number>;
}

/** Build synthetic Category[], Asset[], Snapshot[] from an ExamplePortfolio */
export function buildSyntheticData(portfolio: ExamplePortfolio): ExampleData {
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

  // Build assets from the latest snapshot with name-based IDs
  const latest = portfolio.snapshots[portfolio.snapshots.length - 1];
  const assets: Asset[] = latest.assets.map((a) => ({
    id: `asset-${slugify(a.name)}`,
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
    const entries: SnapshotEntry[] = s.assets.map((a) => ({
      assetId: `asset-${slugify(a.name)}`,
      assetName: a.name,
      categoryId: `cat-${a.category}`,
      value: (s.totalUsd * a.percentage) / 100,
      currency,
    }));

    return {
      id: `snap-${i}`,
      date: new Date(s.year, 5, 15),
      entries,
      totalNetWorth: s.totalUsd,
      primaryCurrency: currency,
      note: s.label,
      createdAt: new Date(s.year, 5, 15),
    };
  });

  // Reverse for display (newest first, like the real app)
  const snapshotsDesc = [...snapshots].reverse();

  return { portfolio, categories, assets, snapshots: snapshotsDesc, currency, rates };
}

/** Look up a portfolio by slug and build its synthetic data */
export function getExampleData(slug: string): ExampleData | null {
  const portfolio = EXAMPLE_PORTFOLIOS.find((p) => p.id === slug);
  if (!portfolio) return null;
  return buildSyntheticData(portfolio);
}
