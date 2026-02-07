import { db } from "@/lib/db";

const PRICE_TTL = 15 * 60 * 1000; // 15 minutes

async function getCached(id: string): Promise<Record<string, number> | null> {
  const cached = await db.priceCache.get(id);
  if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < PRICE_TTL) {
    return cached.price;
  }
  return null;
}

async function setCache(id: string, price: Record<string, number>) {
  await db.priceCache.put({ id, price, fetchedAt: new Date() });
}

export async function fetchCryptoPrice(
  ticker: string,
): Promise<Record<string, number> | null> {
  const cacheKey = `coingecko:${ticker.toLowerCase()}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ticker.toLowerCase())}&vs_currencies=usd,czk,eur`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const prices = data[ticker.toLowerCase()];
    if (!prices) return null;

    const result: Record<string, number> = {
      USD: prices.usd,
      CZK: prices.czk,
      EUR: prices.eur,
    };
    await setCache(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}

export async function fetchStockPrice(
  ticker: string,
): Promise<Record<string, number> | null> {
  const cacheKey = `yahoo:${ticker.toUpperCase()}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker.toUpperCase())}`;
    const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;

    const usdPrice = meta.regularMarketPrice;
    const result: Record<string, number> = { USD: usdPrice };
    await setCache(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}
