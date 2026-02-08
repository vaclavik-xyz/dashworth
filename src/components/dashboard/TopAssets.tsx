"use client";

import type { Asset, Category, Currency } from "@/types";
import { formatCurrency, HIDDEN_VALUE } from "@/lib/utils";
import { convertCurrency } from "@/lib/exchange-rates";
import { getIcon } from "@/lib/icons";
import { COLOR_TEXT_MUTED_CLASSES } from "@/constants/colors";
import Card from "@/components/ui/Card";
import { usePrivacy } from "@/contexts/PrivacyContext";

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
    .map((a) => ({ asset: a, converted: convertCurrency(a.currentValue, a.currency, currency, rates) }))
    .sort((a, b) => b.converted - a.converted)
    .slice(0, 5);

  return (
    <Card>
      <h2 className="mb-3 text-sm font-medium text-zinc-400">Top Assets</h2>
      <div className="space-y-2">
        {top.map(({ asset, converted }) => {
          const cat = categoryMap.get(asset.categoryId);
          const Icon = cat ? getIcon(cat.icon) : null;
          const colorClass = cat ? (COLOR_TEXT_MUTED_CLASSES[cat.color] ?? "text-zinc-400") : "text-zinc-400";

          return (
            <div
              key={asset.id}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {Icon && <Icon className={`h-4 w-4 shrink-0 ${colorClass}`} />}
                <span className="text-sm text-zinc-900 dark:text-white truncate">{asset.name}</span>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
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
