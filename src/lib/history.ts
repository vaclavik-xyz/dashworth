import { db } from "./db";
import { sumConverted } from "./utils";
import { getExchangeRates } from "./exchange-rates";
import type { Currency } from "@/types";

export async function recordHistory(): Promise<void> {
  const [assets, settings] = await Promise.all([
    db.assets.filter((a) => !a.isArchived).toArray(),
    db.settings.get("settings"),
  ]);

  if (!assets || assets.length === 0 || !settings) return;

  const currency: Currency = settings.primaryCurrency;
  const { rates } = await getExchangeRates();
  const totalValue = sumConverted(assets, currency, rates);

  await db.history.add({
    totalValue,
    currency,
    createdAt: new Date(),
  });
}

export async function clearHistory(): Promise<void> {
  await db.history.clear();
}
