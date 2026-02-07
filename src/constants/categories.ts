import type { Category } from "@/types";

export type DefaultCategory = Omit<Category, "id" | "createdAt">;

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: "Crypto", icon: "bitcoin", color: "orange", sortOrder: 0, isDefault: true },
  { name: "Stocks", icon: "trending-up", color: "blue", sortOrder: 1, isDefault: true },
  { name: "Real Estate", icon: "home", color: "emerald", sortOrder: 2, isDefault: true },
  { name: "Domains", icon: "globe", color: "purple", sortOrder: 3, isDefault: true },
  { name: "Gaming", icon: "gamepad-2", color: "red", sortOrder: 4, isDefault: true },
  { name: "Cash & Savings", icon: "banknote", color: "green", sortOrder: 5, isDefault: true },
  { name: "Vehicles", icon: "car", color: "slate", sortOrder: 6, isDefault: true },
  { name: "Collectibles", icon: "gem", color: "amber", sortOrder: 7, isDefault: true },
  { name: "Other", icon: "box", color: "zinc", sortOrder: 8, isDefault: true },
];
