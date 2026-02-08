import { db } from "./db";
import { uuid } from "./utils";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import type { ExamplePortfolio } from "@/constants/example-portfolios";
import type { Category, Asset, Snapshot, SnapshotEntry } from "@/types";

/** Map category names to DEFAULT_CATEGORIES icon/color */
const CAT_DEFAULTS: Record<string, { icon: string; color: string; sortOrder: number }> = {};
for (const cat of DEFAULT_CATEGORIES) {
  CAT_DEFAULTS[cat.name] = { icon: cat.icon, color: cat.color, sortOrder: cat.sortOrder };
}

/**
 * Clear the DB and populate it with a celebrity example portfolio.
 * Creates categories, assets (from latest snapshot), and historical snapshots.
 */
export async function loadExamplePortfolio(portfolio: ExamplePortfolio): Promise<void> {
  const now = new Date();
  const latest = portfolio.snapshots[portfolio.snapshots.length - 1];

  // 1. Build categories from all unique category names across all snapshots
  const catNames = new Set<string>();
  for (const snap of portfolio.snapshots) {
    for (const a of snap.assets) catNames.add(a.category);
  }

  const categoryMap = new Map<string, string>(); // name → id
  const categories: Category[] = [];
  for (const name of catNames) {
    const id = uuid();
    categoryMap.set(name, id);
    categories.push({
      id,
      name,
      icon: CAT_DEFAULTS[name]?.icon ?? "box",
      color: CAT_DEFAULTS[name]?.color ?? "zinc",
      sortOrder: CAT_DEFAULTS[name]?.sortOrder ?? 99,
      createdAt: now,
    });
  }

  // 2. Build assets from the latest snapshot
  const assetMap = new Map<string, string>(); // asset name → id
  const assets: Asset[] = latest.assets.map((a) => {
    const id = uuid();
    assetMap.set(a.name, id);
    return {
      id,
      name: a.name,
      categoryId: categoryMap.get(a.category) ?? "",
      currency: "USD" as const,
      currentValue: (latest.totalUsd * a.percentage) / 100,
      priceSource: "manual" as const,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };
  });

  // 3. Build historical snapshots
  const snapshots: Snapshot[] = portfolio.snapshots.map((s) => {
    const entries: SnapshotEntry[] = s.assets.map((a) => ({
      assetId: assetMap.get(a.name) ?? `unknown-${a.name}`,
      assetName: a.name,
      categoryId: categoryMap.get(a.category) ?? "",
      value: (s.totalUsd * a.percentage) / 100,
      currency: "USD",
    }));

    return {
      id: uuid(),
      date: new Date(s.year, 5, 15), // June 15 of each year
      entries,
      totalNetWorth: s.totalUsd,
      primaryCurrency: "USD" as const,
      note: s.label,
      createdAt: new Date(s.year, 5, 15),
    };
  });

  // 4. Clear DB and populate in a single transaction
  await db.transaction("rw", [db.categories, db.assets, db.snapshots, db.settings], async () => {
    await db.categories.clear();
    await db.assets.clear();
    await db.snapshots.clear();

    await db.categories.bulkAdd(categories);
    await db.assets.bulkAdd(assets);
    await db.snapshots.bulkAdd(snapshots);

    // Upsert settings with sample data flag
    await db.settings.put({
      id: "settings",
      primaryCurrency: "USD",
      theme: (await db.settings.get("settings"))?.theme ?? "dark",
      snapshotReminder: "none",
      autoSnapshot: "off",
      isSampleData: true,
    });
  });
}

/**
 * Clear sample data and reset to fresh state.
 */
export async function clearSampleData(): Promise<void> {
  await db.transaction("rw", [db.categories, db.assets, db.snapshots, db.settings], async () => {
    await db.categories.clear();
    await db.assets.clear();
    await db.snapshots.clear();
    await db.settings.delete("settings");
  });
}
