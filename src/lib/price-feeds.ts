import { db } from "@/lib/db";
import { getExchangeRates, convertCurrency } from "@/lib/exchange-rates";

const PRICE_TTL = 15 * 60 * 1000; // 15 minutes
const CORS_PROXY = "https://corsproxy.io/?url=";

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
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ticker.toLowerCase())}&vs_currencies=usd,czk,eur`;
    const res = await fetch(url);
    if (!res.ok) {
      // Rate limited or other API error — try via CORS proxy as fallback
      const proxyRes = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
      if (!proxyRes.ok) return null;
      const proxyData = await proxyRes.json();
      const proxyPrices = proxyData[ticker.toLowerCase()];
      if (!proxyPrices?.usd) return null;
      const proxyResult: Record<string, number> = {
        USD: proxyPrices.usd,
        CZK: proxyPrices.czk,
        EUR: proxyPrices.eur,
      };
      await setCache(cacheKey, proxyResult);
      return proxyResult;
    }
    const data = await res.json();
    const prices = data[ticker.toLowerCase()];
    if (!prices?.usd) return null;

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
    const res = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;

    const usdPrice = meta.regularMarketPrice;
    const { rates } = await getExchangeRates();
    const result: Record<string, number> = {
      USD: usdPrice,
      CZK: convertCurrency(usdPrice, "USD", "CZK", rates),
      EUR: convertCurrency(usdPrice, "USD", "EUR", rates),
    };
    await setCache(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}
