export type Currency = "CZK" | "EUR" | "USD";

export type Theme = "dark" | "light" | "system";

export type SnapshotReminder = "weekly" | "monthly" | "none";

export type AutoSnapshot = "off" | "daily" | "weekly";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
  isDefault: boolean;
  createdAt: Date;
}

export type PriceSource = "manual" | "coingecko" | "yahoo";

export interface Asset {
  id: string;
  name: string;
  categoryId: string;
  group?: string;
  currency: Currency;
  currentValue: number;
  notes?: string;
  ticker?: string;
  priceSource: PriceSource;
  quantity?: number;
  unitPrice?: number;
  lastPriceUpdate?: Date;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SnapshotEntry {
  assetId: string;
  assetName: string;
  categoryId: string;
  group?: string;
  value: number;
  currency: string;
}

export interface Snapshot {
  id: string;
  date: Date;
  entries: SnapshotEntry[];
  totalNetWorth: number;
  primaryCurrency: Currency;
  note?: string;
  createdAt: Date;
}

export interface UserSettings {
  id: string;
  primaryCurrency: Currency;
  theme: Theme;
  snapshotReminder: SnapshotReminder;
  autoSnapshot: AutoSnapshot;
  lastSnapshotDate?: Date;
}

export interface ExchangeRateCache {
  id: string;
  rates: Record<string, number>;
  fetchedAt: Date;
}

export interface PriceCache {
  id: string;              // "coingecko:{ticker}" or "yahoo:{ticker}"
  price: Record<string, number>; // { usd: 100000, czk: 2350000, eur: 92000 }
  fetchedAt: Date;
}
