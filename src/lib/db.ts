import Dexie, { type EntityTable } from "dexie";
import type { Asset, Category, ExchangeRateCache, HistoryEntry, PriceCache, UserSettings } from "@/types";

const db = new Dexie("dashworth") as Dexie & {
  categories: EntityTable<Category, "id">;
  assets: EntityTable<Asset, "id">;
  settings: EntityTable<UserSettings, "id">;
  exchangeRates: EntityTable<ExchangeRateCache, "id">;
  priceCache: EntityTable<PriceCache, "id">;
  history: EntityTable<HistoryEntry, "id">;
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

export { db };
