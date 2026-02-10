import type { Category } from "@/types";

export type DefaultCategory = Omit<Category, "id" | "createdAt">;

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: "Crypto", icon: "bitcoin", color: "orange", isLiability: false, sortOrder: 0 },
  { name: "Stocks", icon: "trending-up", color: "blue", isLiability: false, sortOrder: 1 },
  { name: "Real Estate", icon: "home", color: "emerald", isLiability: false, sortOrder: 2 },
  { name: "Domains", icon: "globe", color: "purple", isLiability: false, sortOrder: 3 },
  { name: "Gaming", icon: "gamepad-2", color: "red", isLiability: false, sortOrder: 4 },
  { name: "Cash & Savings", icon: "banknote", color: "green", isLiability: false, sortOrder: 5 },
  { name: "Vehicles", icon: "car", color: "slate", isLiability: false, sortOrder: 6 },
  { name: "Collectibles", icon: "gem", color: "amber", isLiability: false, sortOrder: 7 },
  { name: "Other", icon: "box", color: "zinc", isLiability: false, sortOrder: 8 },
  { name: "Loans & Mortgages", icon: "landmark", color: "rose", isLiability: true, sortOrder: 9 },
  { name: "Credit Cards", icon: "credit-card", color: "red", isLiability: true, sortOrder: 10 },
];
