"use client";

import type { Asset, Currency } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { convertCurrency } from "@/lib/exchange-rates";

interface GroupDetailProps {
  group: string;
  assets: Asset[];
  currency: Currency;
  rates: Record<string, number>;
}

export default function GroupDetail({ group, assets, currency, rates }: GroupDetailProps) {
  const total = assets.reduce((sum, a) => sum + convertCurrency(a.currentValue, a.currency, currency, rates), 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-zinc-900 dark:text-white">{group}</h3>
        <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-white">
          {formatCurrency(total, currency)}
        </p>
        <p className="text-xs text-zinc-500">{assets.length} {assets.length === 1 ? "asset" : "assets"}</p>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-medium text-zinc-500">Assets</h4>
        <div className="space-y-2">
          {assets
            .map((asset) => ({
              asset,
              converted: convertCurrency(asset.currentValue, asset.currency, currency, rates),
            }))
            .sort((a, b) => b.converted - a.converted)
            .map(({ asset, converted }) => (
              <div key={asset.id} className="flex items-center justify-between rounded-lg bg-[var(--dw-hover)] px-3 py-2">
                <span className="text-sm text-zinc-900 dark:text-white">{asset.name}</span>
                <div className="text-right">
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    {formatCurrency(converted, currency)}
                  </span>
                  {total > 0 && (
                    <span className="ml-2 text-xs text-zinc-500">
                      {((converted / total) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
