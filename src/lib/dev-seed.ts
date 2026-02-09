import { db } from "./db";
import { seedDatabase } from "./seed";
import { uuid } from "./utils";
import type { Asset, Category, HistoryEntry, Currency } from "@/types";

function monthsAgo(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d;
}

// Realistic value progression over 6 months (index 0 = oldest)
const VALUE_HISTORY: Record<string, number[]> = {
  bitcoin:     [980000, 1120000, 1050000, 1250000, 1180000, 1350000],
  ethereum:    [72000,   85000,   78000,   92000,   88000,  105000],
  btcBinance:  [220000,  250000,  235000,  280000,  265000,  300000],
  apple:       [45000,   47000,   44000,   49000,   51000,   53000],
  apartment:   [6200000, 6200000, 6300000, 6300000, 6400000, 6500000],
  dragonLore:  [38000,   42000,   45000,   41000,   48000,   52000],
  domain:      [25000,   25000,   25000,   28000,   28000,   30000],
  car:         [320000,  310000,  300000,  295000,  290000,  280000],
  savings:     [150000,  165000,  180000,  195000,  210000,  230000],
  tesla:       [12000,   14500,   13000,   16000,   15500,   17000],
  gold:        [55000,   58000,   60000,   62000,   59000,   64000],
};

interface AssetDef {
  key: string;
  name: string;
  categoryName: string;
  group?: string;
  currency: Currency;
}

const ASSET_DEFS: AssetDef[] = [
  { key: "bitcoin",    name: "Bitcoin — Trezor",     categoryName: "Crypto",          group: "Bitcoin",   currency: "CZK" },
  { key: "ethereum",   name: "Ethereum — Binance",   categoryName: "Crypto",          group: "Ethereum",  currency: "CZK" },
  { key: "btcBinance", name: "Bitcoin — Binance",    categoryName: "Crypto",          group: "Bitcoin",   currency: "CZK" },
  { key: "apple",      name: "Apple (AAPL)",         categoryName: "Stocks",          group: "US Tech",   currency: "USD" },
  { key: "tesla",      name: "Tesla (TSLA)",         categoryName: "Stocks",          group: "US Tech",   currency: "USD" },
  { key: "apartment",  name: "Byt Praha 6",          categoryName: "Real Estate",     currency: "CZK" },
  { key: "dragonLore", name: "AWP Dragon Lore FN",   categoryName: "Gaming",          currency: "CZK" },
  { key: "domain",     name: "dashworth.net",        categoryName: "Domains",         currency: "USD" },
  { key: "car",        name: "Škoda Octavia RS",     categoryName: "Vehicles",        currency: "CZK" },
  { key: "savings",    name: "Spořicí účet Fio",     categoryName: "Cash & Savings",  currency: "CZK" },
  { key: "gold",       name: "Zlaté slitky 1oz",     categoryName: "Collectibles",    currency: "CZK" },
];

export async function devSeedDatabase(): Promise<void> {
  // First run normal seed to get categories + settings
  await seedDatabase();

  // Check if dev data already exists
  const assetCount = await db.assets.count();
  if (assetCount > 0) return;

  const categories = await db.categories.toArray();
  const categoryByName = new Map<string, Category>(categories.map((c) => [c.name, c]));

  const now = new Date();

  // Create assets with latest values
  const assets: Asset[] = ASSET_DEFS.map((def) => {
    const history = VALUE_HISTORY[def.key];
    return {
      id: uuid(),
      name: def.name,
      categoryId: categoryByName.get(def.categoryName)!.id,
      group: def.group,
      currency: def.currency,
      currentValue: history[history.length - 1],
      priceSource: "manual",
      isArchived: false,
      createdAt: monthsAgo(6),
      updatedAt: now,
    };
  });

  // Create 6 monthly history entries from total values
  const historyDates = [monthsAgo(5), monthsAgo(4), monthsAgo(3), monthsAgo(2), monthsAgo(1), now];
  const historyEntries: Omit<HistoryEntry, "id">[] = Array.from({ length: 6 }, (_, i) => {
    // Sum all asset values at this point in time
    const totalValue = ASSET_DEFS.reduce((sum, def) => sum + VALUE_HISTORY[def.key][i], 0);
    return {
      totalValue,
      currency: "CZK" as Currency,
      createdAt: historyDates[i],
    };
  });

  await db.transaction("rw", [db.assets, db.history], async () => {
    await db.assets.bulkAdd(assets);
    await db.history.bulkAdd(historyEntries);
  });
}
