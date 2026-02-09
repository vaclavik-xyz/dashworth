"use client";

import type { Asset, AssetChangeEntry, Category } from "@/types";
import { formatCurrency, HIDDEN_VALUE } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import { COLOR_BADGE_CLASSES } from "@/constants/colors";
import Card from "@/components/ui/Card";
import { usePrivacy } from "@/contexts/PrivacyContext";
import PriceSourceBadge from "@/components/ui/PriceSourceBadge";

interface AssetCardProps {
  asset: Asset;
  category?: Category;
  latestChange?: AssetChangeEntry;
}

export default function AssetCard({ asset, category, latestChange }: AssetCardProps) {
  const { hidden } = usePrivacy();
  const Icon = getIcon(asset.icon ?? category?.icon ?? "box");
  const colorClass = category ? (COLOR_BADGE_CLASSES[category.color] ?? COLOR_BADGE_CLASSES.zinc) : COLOR_BADGE_CLASSES.zinc;
  const isAuto = asset.priceSource !== "manual";

  const pctChange = latestChange && latestChange.oldValue !== 0
    ? ((latestChange.newValue - latestChange.oldValue) / latestChange.oldValue) * 100
    : null;

  return (
    <Card>
      {/* Row 1: Icon + Name + Badge + Value */}
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="font-medium text-zinc-900 dark:text-white truncate min-w-0 flex-1">{asset.name}</span>
        <PriceSourceBadge source={asset.priceSource} size="sm" />
        <span className="text-base font-bold text-zinc-900 dark:text-white shrink-0">
          {hidden ? HIDDEN_VALUE : formatCurrency(asset.currentValue, asset.currency)}
        </span>
      </div>
      {/* Row 2: Quantity/Category + % change */}
      <div className="mt-1 flex items-center justify-between pl-11">
        <span className="text-xs text-zinc-500 truncate">
          {isAuto && asset.quantity != null && asset.ticker
            ? `${asset.quantity.toLocaleString()} ${asset.ticker.toUpperCase()}`
            : category?.name ?? "Unknown"}
        </span>
        {isAuto && pctChange !== null && (
          <span className={`text-xs font-medium shrink-0 ml-2 ${pctChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {pctChange >= 0 ? "+" : ""}{pctChange.toFixed(1)}% {pctChange >= 0 ? "↑" : "↓"}
          </span>
        )}
      </div>
    </Card>
  );
}
