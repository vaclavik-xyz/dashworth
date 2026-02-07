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

export { db };
