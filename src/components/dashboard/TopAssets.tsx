"use client";

import type { Asset, Category, Currency } from "@/types";
import { formatCurrency, HIDDEN_VALUE } from "@/lib/utils";
import { convertCurrency } from "@/lib/exchange-rates";
import { getIcon } from "@/lib/icons";
import { COLOR_TEXT_MUTED_CLASSES } from "@/constants/colors";
import Card from "@/components/ui/Card";
import { usePrivacy } from "@/contexts/PrivacyContext";
import PriceSourceBadge from "@/components/ui/PriceSourceBadge";

interface TopAssetsProps {
  assets: Asset[];
  categories: Category[];
  currency: Currency;
  rates: Record<string, number>;
}

export default function TopAssets({ assets, categories, currency, rates }: TopAssetsProps) {
  const { hidden } = usePrivacy();

  if (assets.length === 0) return null;

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const top = [...assets]
    .map((a) => ({ asset: a, converted: convertCurrency(a.currentValue, a.currency, currency, rates), isLiability: categoryMap.get(a.categoryId)?.isLiability ?? false }))
    .sort((a, b) => b.converted - a.converted)
    .slice(0, 5);

  return (
    <Card>
      <h2 className="mb-3 text-sm font-medium text-zinc-400">Top Assets</h2>
      <div className="space-y-2">
        {top.map(({ asset, converted, isLiability }) => {
          const cat = categoryMap.get(asset.categoryId);
          const Icon = getIcon(asset.icon ?? cat?.icon ?? "box");
          const colorClass = cat ? (COLOR_TEXT_MUTED_CLASSES[cat.color] ?? "text-zinc-400") : "text-zinc-400";

          return (
            <div
              key={asset.id}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`h-4 w-4 shrink-0 ${colorClass}`} />
                <span className="text-sm text-zinc-900 dark:text-white truncate">{asset.name}</span>
                <span className="shrink-0">
                  <PriceSourceBadge source={asset.priceSource} size="sm" />
                </span>
              </div>
              <div className="shrink-0 text-right flex items-center gap-1.5">
                {isLiability && (
                  <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-400">debt</span>
                )}
                <span className={`text-sm font-medium ${isLiability ? "text-red-400" : "text-zinc-900 dark:text-white"}`}>
                  {hidden ? HIDDEN_VALUE : formatCurrency(converted, currency)}
                </span>
                {asset.currency !== currency && !hidden && (
                  <p className="text-xs text-zinc-500">
                    {formatCurrency(asset.currentValue, asset.currency)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
