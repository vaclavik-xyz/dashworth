export type Currency = "CZK" | "EUR" | "USD";

export type Theme = "dark" | "light" | "system";

export type SnapshotReminder = "weekly" | "monthly" | "none";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
  isDefault: boolean;
  createdAt: Date;
}

export interface Asset {
  id: string;
  name: string;
  categoryId: string;
  group?: string;
  currency: Currency;
  currentValue: number;
  notes?: string;
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
  lastSnapshotDate?: Date;
}
