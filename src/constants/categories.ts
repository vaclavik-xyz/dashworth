import type { Category } from "@/types";

export type DefaultCategory = Omit<Category, "id" | "createdAt">;

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: "Crypto", icon: "bitcoin", color: "orange", sortOrder: 0 },
  { name: "Stocks", icon: "trending-up", color: "blue", sortOrder: 1 },
  { name: "Real Estate", icon: "home", color: "emerald", sortOrder: 2 },
  { name: "Domains", icon: "globe", color: "purple", sortOrder: 3 },
  { name: "Gaming", icon: "gamepad-2", color: "red", sortOrder: 4 },
  { name: "Cash & Savings", icon: "banknote", color: "green", sortOrder: 5 },
  { name: "Vehicles", icon: "car", color: "slate", sortOrder: 6 },
  { name: "Collectibles", icon: "gem", color: "amber", sortOrder: 7 },
  { name: "Other", icon: "box", color: "zinc", sortOrder: 8 },
];
