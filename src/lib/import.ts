import { db } from "./db";
import type { Asset, Category, HistoryEntry, UserSettings } from "@/types";

interface ImportDataV2 {
  app: "dashworth";
  version: number;
  data: {
    categories: Category[];
    assets: Asset[];
    history?: HistoryEntry[];
    snapshots?: Array<{
      totalNetWorth: number;
      primaryCurrency: string;
      date: Date | string;
    }>;
    settings: UserSettings;
  };
}

export function validateImport(data: unknown): data is ImportDataV2 {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;

  if (obj.app !== "dashworth") return false;
  if (typeof obj.version !== "number") return false;
  if (typeof obj.data !== "object" || obj.data === null) return false;

  const d = obj.data as Record<string, unknown>;
  if (!Array.isArray(d.categories)) return false;
  if (!Array.isArray(d.assets)) return false;
  if (typeof d.settings !== "object" || d.settings === null) return false;

  // Accept either history (v2) or snapshots (v1)
  if (!Array.isArray(d.history) && !Array.isArray(d.snapshots)) return false;

  return true;
}

export async function importData(data: ImportDataV2): Promise<void> {
  // Convert v1 snapshots to history entries if needed
  let historyEntries: HistoryEntry[] = [];
  if (data.data.history && data.data.history.length > 0) {
    historyEntries = data.data.history;
  } else if (data.data.snapshots && data.data.snapshots.length > 0) {
    historyEntries = data.data.snapshots.map((s) => ({
      totalValue: s.totalNetWorth,
      currency: s.primaryCurrency as HistoryEntry["currency"],
      createdAt: new Date(s.date),
    }));
  }

  // Clean snapshot-related fields from imported settings
  const cleanSettings = { ...data.data.settings };
  delete (cleanSettings as Record<string, unknown>).snapshotReminder;
  delete (cleanSettings as Record<string, unknown>).autoSnapshot;
  delete (cleanSettings as Record<string, unknown>).lastSnapshotDate;

  await db.transaction(
    "rw",
    [db.categories, db.assets, db.history, db.settings],
    async () => {
      await db.categories.clear();
      await db.assets.clear();
      await db.history.clear();
      await db.settings.clear();

      // Ensure every category has a sortOrder (missing from older exports)
      const categories = data.data.categories.map((cat, i) => ({
        ...cat,
        sortOrder: cat.sortOrder ?? i,
      }));
      await db.categories.bulkAdd(categories);
      await db.assets.bulkAdd(data.data.assets);
      if (historyEntries.length > 0) {
        await db.history.bulkAdd(historyEntries);
      }
      await db.settings.add(cleanSettings);
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
