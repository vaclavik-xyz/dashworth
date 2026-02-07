import { db } from "@/lib/db";
import { fetchCryptoPrice, fetchStockPrice } from "@/lib/price-feeds";
import type { Currency } from "@/types";

export async function refreshAutoPrices(): Promise<void> {
  const assets = await db.assets
    .filter((a) => !a.isArchived && a.priceSource !== "manual" && !!a.ticker)
    .toArray();

  const now = new Date();

  for (const asset of assets) {
    try {
      let prices: Record<string, number> | null = null;

      if (asset.priceSource === "coingecko") {
        prices = await fetchCryptoPrice(asset.ticker!);
      } else if (asset.priceSource === "yahoo") {
        prices = await fetchStockPrice(asset.ticker!);
      }

      if (!prices) continue;

      const price = prices[asset.currency as Currency];
      if (price != null && price > 0) {
        await db.assets.update(asset.id, {
          currentValue: price,
          lastPriceUpdate: now,
          updatedAt: now,
        });
      }
    } catch {
      // Skip failed individual assets
    }
  }
}
