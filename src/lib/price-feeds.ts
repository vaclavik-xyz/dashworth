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

// Common ticker symbol → CoinGecko ID mapping
const SYMBOL_TO_ID: Record<string, string> = {
  btc: "bitcoin",
  eth: "ethereum",
  sol: "solana",
  xmr: "monero",
  xrp: "ripple",
  ada: "cardano",
  bnb: "binancecoin",
};

function resolveCoinGeckoId(ticker: string): string {
  const lower = ticker.toLowerCase();
  return SYMBOL_TO_ID[lower] ?? lower;
}

export async function fetchCryptoPrice(
  ticker: string,
): Promise<Record<string, number> | null> {
  const id = resolveCoinGeckoId(ticker);
  const cacheKey = `coingecko:${id}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd,czk,eur`;
    const res = await fetch(url);
    if (!res.ok) {
      // Rate limited or other API error — try via CORS proxy as fallback
      const proxyRes = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
      if (!proxyRes.ok) return null;
      const proxyData = await proxyRes.json();
      const proxyPrices = proxyData[id];
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
    const prices = data[id];
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

export interface PriceFetchResult {
  prices: Record<string, number>;
  name: string;
  symbol: string;
}

/**
 * Detailed crypto price fetch — returns name, symbol, and prices.
 * Uses CoinGecko /coins/{id} with minimal params for name + prices in one call.
 */
export async function fetchCryptoPriceDetailed(
  ticker: string,
): Promise<PriceFetchResult | null> {
  const id = resolveCoinGeckoId(ticker);

  try {
    const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    let data;

    const res = await fetch(url);
    if (!res.ok) {
      const proxyRes = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
      if (!proxyRes.ok) return null;
      data = await proxyRes.json();
    } else {
      data = await res.json();
    }

    const cp = data?.market_data?.current_price;
    if (!cp?.usd) return null;

    const prices: Record<string, number> = {
      USD: cp.usd,
      CZK: cp.czk,
      EUR: cp.eur,
    };

    // Populate the regular price cache so fetchCryptoPrice() benefits too
    await setCache(`coingecko:${id}`, prices);

    return {
      prices,
      name: data.name ?? id.charAt(0).toUpperCase() + id.slice(1),
      symbol: (data.symbol ?? ticker).toUpperCase(),
    };
  } catch {
    return null;
  }
}

/**
 * Detailed stock price fetch — returns company name, ticker symbol, and prices.
 */
export async function fetchStockPriceDetailed(
  ticker: string,
): Promise<PriceFetchResult | null> {
  const upper = ticker.toUpperCase();

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(upper)}`;
    const res = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;

    const usdPrice = meta.regularMarketPrice;
    const { rates } = await getExchangeRates();
    const prices: Record<string, number> = {
      USD: usdPrice,
      CZK: convertCurrency(usdPrice, "USD", "CZK", rates),
      EUR: convertCurrency(usdPrice, "USD", "EUR", rates),
    };

    // Populate the regular price cache
    await setCache(`yahoo:${upper}`, prices);

    return {
      prices,
      name: meta.shortName ?? meta.longName ?? upper,
      symbol: meta.symbol ?? upper,
    };
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
