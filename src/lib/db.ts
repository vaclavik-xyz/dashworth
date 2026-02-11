import Dexie, { type EntityTable } from "dexie";
import type { Asset, AssetChangeEntry, Category, ExchangeRateCache, HistoryEntry, PriceCache, UserSettings } from "@/types";

const db = new Dexie("dashworth") as Dexie & {
  categories: EntityTable<Category, "id">;
  assets: EntityTable<Asset, "id">;
  settings: EntityTable<UserSettings, "id">;
  exchangeRates: EntityTable<ExchangeRateCache, "id">;
  priceCache: EntityTable<PriceCache, "id">;
  history: EntityTable<HistoryEntry, "id">;
  assetChanges: EntityTable<AssetChangeEntry, "id">;
};

db.version(1).stores({
  categories: "id, name, sortOrder",
  assets: "id, categoryId, name, isArchived, updatedAt",
  snapshots: "id, date, createdAt",
  settings: "id",
});

db.version(2).stores({
  assets: "id, categoryId, name, group, isArchived, updatedAt",
}).upgrade((tx) => {
  return tx.table("assets").toCollection().modify(() => {
    // no-op: group field is optional, undefined by default
  });
});

db.version(3).stores({
  exchangeRates: "id",
});

db.version(4).stores({
  assets: "id, categoryId, name, group, priceSource, isArchived, updatedAt",
  priceCache: "id",
}).upgrade((tx) => {
  return tx.table("assets").toCollection().modify((asset) => {
    if (!asset.priceSource) asset.priceSource = "manual";
  });
});

db.version(5).stores({}).upgrade((tx) => {
  return tx.table("assets").toCollection().modify((asset) => {
    if (asset.priceSource !== "manual" && asset.quantity == null) {
      asset.quantity = 1;
      asset.unitPrice = asset.currentValue;
    }
  });
});

db.version(6).stores({}).upgrade((tx) => {
  return tx.table("settings").toCollection().modify((s) => {
    if (s.autoSnapshot == null) s.autoSnapshot = "off";
  });
});

db.version(7).stores({}).upgrade((tx) => {
  return tx.table("categories").toCollection().modify((cat) => {
    delete cat.isDefault;
  });
});

db.version(8).stores({
  history: "++id, createdAt",
  snapshots: null, // delete snapshots table
}).upgrade((tx) => {
  // Migrate existing snapshots to history entries
  return tx.table("snapshots").toArray().then((snapshots: Array<{
    totalNetWorth: number;
    primaryCurrency: string;
    date: Date;
  }>) => {
    const historyEntries = snapshots.map((s) => ({
      totalValue: s.totalNetWorth,
      currency: s.primaryCurrency,
      createdAt: new Date(s.date),
    }));
    if (historyEntries.length > 0) {
      return tx.table("history").bulkAdd(historyEntries);
    }
  }).then(() => {
    // Clean up snapshot-related fields from settings
    return tx.table("settings").toCollection().modify((s: Record<string, unknown>) => {
      delete s.snapshotReminder;
      delete s.autoSnapshot;
      delete s.lastSnapshotDate;
    });
  });
});

db.version(9).stores({
  assetChanges: "++id, assetId, createdAt",
});

db.version(10).stores({});
// No schema index change — icon is not indexed

db.version(11).stores({}).upgrade(async (tx) => {
  // Add isLiability = false to all existing categories
  await tx.table("categories").toCollection().modify((cat) => {
    if (cat.isLiability == null) cat.isLiability = false;
  });

  // Add default liability categories if they don't exist
  const existing = await tx.table("categories").toArray();
  const names = new Set(existing.map((c: { name: string }) => c.name));
  const maxSort = existing.reduce((max: number, c: { sortOrder?: number }) => Math.max(max, c.sortOrder ?? 0), 0);

  const defaults = [
    { name: "Loans & Mortgages", icon: "landmark", color: "rose", isLiability: true },
    { name: "Credit Cards", icon: "credit-card", color: "red", isLiability: true },
  ];

  let nextSort = maxSort + 1;
  for (const d of defaults) {
    if (!names.has(d.name)) {
      const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
      await tx.table("categories").add({
        id,
        ...d,
        sortOrder: nextSort++,
        createdAt: new Date(),
      });
    }
  }
});

db.version(12).stores({}).upgrade(async (tx) => {
  const domains = await tx.table("categories").where("name").equals("Domains").first();
  if (domains) {
    const assetCount = await tx.table("assets").where("categoryId").equals(domains.id).count();
    if (assetCount === 0) {
      await tx.table("categories").delete(domains.id);
    }
  }
});

export { db };
