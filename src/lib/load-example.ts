import { db } from "./db";
import { uuid } from "./utils";
import type { ExamplePortfolio } from "@/constants/example-portfolios";
import type { Category, Asset, Snapshot, SnapshotEntry } from "@/types";

/**
 * Clear the DB and populate it with a celebrity example portfolio.
 * Creates custom categories (with icons/colors from portfolio data),
 * assets with groups, and historical snapshots.
 */
export async function loadExamplePortfolio(portfolio: ExamplePortfolio): Promise<void> {
  const now = new Date();
  const latest = portfolio.snapshots[portfolio.snapshots.length - 1];

  // 1. Build categories from the portfolio's custom category definitions
  const categoryMap = new Map<string, string>(); // category name → id
  const categories: Category[] = portfolio.categories.map((cat, i) => {
    const id = uuid();
    categoryMap.set(cat.name, id);
    return {
      id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      sortOrder: i,
      createdAt: now,
    };
  });

  // 2. Build assets from the latest snapshot (with groups + auto-fetch)
  const assetMap = new Map<string, string>(); // asset name → id
  const assets: Asset[] = latest.assets.map((a) => {
    const id = uuid();
    assetMap.set(a.name, id);
    const value = (latest.totalUsd * a.percentage) / 100;
    const source = a.priceSource ?? "manual";
    return {
      id,
      name: a.name,
      categoryId: categoryMap.get(a.category) ?? "",
      group: a.group,
      currency: "USD" as const,
      currentValue: value,
      priceSource: source as Asset["priceSource"],
      ticker: a.ticker,
      quantity: a.quantity,
      unitPrice: a.quantity ? value / a.quantity : undefined,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };
  });

  // 3. Build historical snapshots (with groups on entries)
  const snapshots: Snapshot[] = portfolio.snapshots.map((s) => {
    const entries: SnapshotEntry[] = s.assets.map((a) => ({
      assetId: assetMap.get(a.name) ?? `unknown-${a.name}`,
      assetName: a.name,
      categoryId: categoryMap.get(a.category) ?? "",
      group: a.group,
      value: (s.totalUsd * a.percentage) / 100,
      currency: "USD",
    }));

    return {
      id: uuid(),
      date: new Date(s.year, 5, 15),
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
