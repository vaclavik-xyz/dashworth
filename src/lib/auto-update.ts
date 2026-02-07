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

      const newUnitPrice = prices[asset.currency as Currency];
      if (newUnitPrice != null && newUnitPrice > 0) {
        const qty = asset.quantity ?? 1;
        await db.assets.update(asset.id, {
          unitPrice: newUnitPrice,
          currentValue: qty * newUnitPrice,
          lastPriceUpdate: now,
          updatedAt: now,
        });
      }
    } catch {
      // Skip failed individual assets
    }
  }
}
