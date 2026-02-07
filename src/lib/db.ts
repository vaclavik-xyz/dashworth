import Dexie, { type EntityTable } from "dexie";
import type { Asset, Category, Snapshot, UserSettings } from "@/types";

const db = new Dexie("dashworth") as Dexie & {
  categories: EntityTable<Category, "id">;
  assets: EntityTable<Asset, "id">;
  snapshots: EntityTable<Snapshot, "id">;
  settings: EntityTable<UserSettings, "id">;
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

export { db };
