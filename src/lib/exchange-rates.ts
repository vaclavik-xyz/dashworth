import { db } from "@/lib/db";

const FALLBACK_RATES: Record<string, number> = { USD: 1, CZK: 23.5, EUR: 0.92 };
const TTL = 60 * 60 * 1000; // 1 hour

export async function getExchangeRates(): Promise<{ rates: Record<string, number>; fetchedAt: Date | null }> {
  const cached = await db.exchangeRates.get("rates");
  if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < TTL) {
    return { rates: cached.rates, fetchedAt: cached.fetchedAt };
  }

  try {
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();
    const rates = data.rates as Record<string, number>;
    const fetchedAt = new Date();
    await db.exchangeRates.put({ id: "rates", rates, fetchedAt });
    return { rates, fetchedAt };
  } catch {
    if (cached) return { rates: cached.rates, fetchedAt: cached.fetchedAt };
    return { rates: FALLBACK_RATES, fetchedAt: null };
  }
}

export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>,
): number {
  if (from === to) return amount;
  const fromRate = rates[from] ?? 1;
  const toRate = rates[to] ?? 1;
  return (amount / fromRate) * toRate;
}
