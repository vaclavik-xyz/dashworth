import { db } from "./db";
import { uuid } from "./utils";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import type { Category, UserSettings } from "@/types";

export async function seedDatabase(): Promise<void> {
  const existingSettings = await db.settings.get("settings");
  if (existingSettings) return;

  const now = new Date();

  const categories: Category[] = DEFAULT_CATEGORIES.map((cat) => ({
    ...cat,
    id: uuid(),
    createdAt: now,
  }));

  const settings: UserSettings = {
    id: "settings",
    primaryCurrency: "CZK",
    theme: "dark",
    snapshotReminder: "none",
    autoSnapshot: "off",
    showHints: true,
  };

  await db.transaction("rw", db.categories, db.settings, async () => {
    await db.categories.bulkAdd(categories);
    await db.settings.add(settings);
  });
}
