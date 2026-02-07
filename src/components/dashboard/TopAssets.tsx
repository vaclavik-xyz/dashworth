"use client";

import type { Asset, Category } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import Card from "@/components/ui/Card";

const COLOR_CLASSES: Record<string, string> = {
  orange: "text-orange-400",
  blue: "text-blue-400",
  emerald: "text-emerald-400",
  purple: "text-purple-400",
  red: "text-red-400",
  green: "text-green-400",
  slate: "text-slate-400",
  amber: "text-amber-400",
  zinc: "text-zinc-400",
};

interface TopAssetsProps {
  assets: Asset[];
  categories: Category[];
}

export default function TopAssets({ assets, categories }: TopAssetsProps) {
  if (assets.length === 0) return null;

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const top = [...assets].sort((a, b) => b.currentValue - a.currentValue).slice(0, 5);

  return (
    <Card>
      <h2 className="mb-3 text-sm font-medium text-zinc-400">Top Assets</h2>
      <div className="space-y-2">
        {top.map((asset) => {
          const cat = categoryMap.get(asset.categoryId);
          const Icon = cat ? getIcon(cat.icon) : null;
          const colorClass = cat ? (COLOR_CLASSES[cat.color] ?? "text-zinc-400") : "text-zinc-400";

          return (
            <div
              key={asset.id}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {Icon && <Icon className={`h-4 w-4 shrink-0 ${colorClass}`} />}
                <span className="text-sm text-white truncate">{asset.name}</span>
              </div>
              <span className="shrink-0 text-sm font-medium text-white">
                {formatCurrency(asset.currentValue, asset.currency)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
