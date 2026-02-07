import Dexie, { type EntityTable } from "dexie";
import type { Asset, Category, ExchangeRateCache, PriceCache, Snapshot, UserSettings } from "@/types";

const db = new Dexie("dashworth") as Dexie & {
  categories: EntityTable<Category, "id">;
  assets: EntityTable<Asset, "id">;
  snapshots: EntityTable<Snapshot, "id">;
  settings: EntityTable<UserSettings, "id">;
  exchangeRates: EntityTable<ExchangeRateCache, "id">;
  priceCache: EntityTable<PriceCache, "id">;
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
  // Existing assets get no group (undefined) — no data migration needed
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

export { db };
