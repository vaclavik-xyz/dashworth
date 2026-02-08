"use client";

import type { Asset, Category, Currency } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import { COLOR_HEX } from "@/constants/colors";

interface AssetDetailProps {
  asset: Asset;
  category: Category | undefined;
  currency: Currency;
  rates: Record<string, number>;
}

export default function AssetDetail({ asset, category }: AssetDetailProps) {
  const Icon = category ? getIcon(category.icon) : null;
  const catColor = COLOR_HEX[category?.color ?? "zinc"] ?? COLOR_HEX.zinc;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5" style={{ color: catColor }} />}
          <h3 className="text-sm font-medium text-zinc-900 dark:text-white">{asset.name}</h3>
        </div>
        <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">
          {formatCurrency(asset.currentValue, asset.currency)}
        </p>
        <div className="mt-2 space-y-1 text-xs text-zinc-500">
          <p>Category: <span className="text-zinc-700 dark:text-zinc-300">{category?.name ?? "Unknown"}</span></p>
          {asset.group && (
            <p>Group: <span className="text-zinc-700 dark:text-zinc-300">{asset.group}</span></p>
          )}
          <p>Currency: <span className="text-zinc-700 dark:text-zinc-300">{asset.currency}</span></p>
          <p>Updated: <span className="text-zinc-700 dark:text-zinc-300">{formatDate(asset.updatedAt)}</span></p>
        </div>
        {asset.notes && (
          <p className="mt-3 rounded-lg bg-[var(--dw-hover)] p-3 text-xs text-zinc-600 dark:text-zinc-400">
            {asset.notes}
          </p>
        )}
      </div>
    </div>
  );
}
