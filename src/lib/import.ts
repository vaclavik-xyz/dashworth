import { db } from "./db";
import type { Asset, Category, Snapshot, UserSettings } from "@/types";

interface ImportData {
  app: "dashworth";
  version: number;
  data: {
    categories: Category[];
    assets: Asset[];
    snapshots: Snapshot[];
    settings: UserSettings;
  };
}

export function validateImport(data: unknown): data is ImportData {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;

  if (obj.app !== "dashworth") return false;
  if (typeof obj.version !== "number") return false;
  if (typeof obj.data !== "object" || obj.data === null) return false;

  const d = obj.data as Record<string, unknown>;
  if (!Array.isArray(d.categories)) return false;
  if (!Array.isArray(d.assets)) return false;
  if (!Array.isArray(d.snapshots)) return false;
  if (typeof d.settings !== "object" || d.settings === null) return false;

  return true;
}

export async function importData(data: ImportData): Promise<void> {
  await db.transaction(
    "rw",
    db.categories,
    db.assets,
    db.snapshots,
    db.settings,
    async () => {
      await db.categories.clear();
      await db.assets.clear();
      await db.snapshots.clear();
      await db.settings.clear();

      await db.categories.bulkAdd(data.data.categories);
      await db.assets.bulkAdd(data.data.assets);
      await db.snapshots.bulkAdd(data.data.snapshots);
      await db.settings.add(data.data.settings);
    }
  );
}

export function readJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result as string));
      } catch {
        reject(new Error("Invalid JSON file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
