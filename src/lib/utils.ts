import type { Asset, Currency } from "@/types";
import { convertCurrency } from "@/lib/exchange-rates";

export function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID (older mobile browsers)
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16),
  );
}

const CURRENCY_LOCALE: Record<Currency, string> = {
  CZK: "cs-CZ",
  EUR: "de-DE",
  USD: "en-US",
};

export const HIDDEN_VALUE = "•••••";

export function formatCurrency(value: number, currency: Currency): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("cs-CZ", { day: "numeric", month: "short", year: "numeric" });
}

export function sumConverted(
  assets: Asset[],
  targetCurrency: Currency,
  rates: Record<string, number>,
): number {
  return assets.reduce(
    (sum, a) => sum + convertCurrency(a.currentValue, a.currency, targetCurrency, rates),
    0,
  );
}
