import { db } from "@/lib/db";
import { uuid } from "@/lib/utils";
import { convertCurrency } from "@/lib/exchange-rates";
import { getExchangeRates } from "@/lib/exchange-rates";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function checkAutoSnapshot(): Promise<void> {
  const settings = await db.settings.get("settings");
  if (!settings || settings.autoSnapshot === "off") return;

  const lastDate = settings.lastSnapshotDate
    ? new Date(settings.lastSnapshotDate).getTime()
    : 0;
  const now = Date.now();

  const threshold =
    settings.autoSnapshot === "daily" ? DAY_MS : 7 * DAY_MS;

  if (now - lastDate < threshold) return;

  const assets = await db.assets.filter((a) => !a.isArchived).toArray();
  if (assets.length === 0) return;

  const { rates } = await getExchangeRates();
  const snapshotDate = new Date();

  const entries = assets.map((a) => ({
    assetId: a.id,
    assetName: a.name,
    categoryId: a.categoryId,
    group: a.group,
    value: a.currentValue,
    currency: a.currency as string,
  }));

  const totalNetWorth = entries.reduce(
    (sum, e) =>
      sum +
      convertCurrency(e.value, e.currency, settings.primaryCurrency, rates),
    0,
  );

  await db.transaction("rw", db.snapshots, db.settings, async () => {
    await db.snapshots.add({
      id: uuid(),
      date: snapshotDate,
      entries,
      totalNetWorth,
      primaryCurrency: settings.primaryCurrency,
      note: "Auto-snapshot",
      createdAt: snapshotDate,
    });
    await db.settings.update("settings", { lastSnapshotDate: snapshotDate });
  });
}
