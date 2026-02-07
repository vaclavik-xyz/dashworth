"use client";

import { Pencil, Trash2, RefreshCw } from "lucide-react";
import type { Asset, Category, Currency } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { convertCurrency } from "@/lib/exchange-rates";
import { getIcon } from "@/lib/icons";
import { COLOR_BADGE_CLASSES } from "@/constants/colors";
import Card from "@/components/ui/Card";

interface AssetCardProps {
  asset: Asset;
  category?: Category;
  onEdit: () => void;
  onDelete: () => void;
  primaryCurrency?: Currency;
  rates?: Record<string, number>;
}

export default function AssetCard({ asset, category, onEdit, onDelete, primaryCurrency, rates }: AssetCardProps) {
  const Icon = category ? getIcon(category.icon) : null;
  const colorClass = category ? (COLOR_BADGE_CLASSES[category.color] ?? COLOR_BADGE_CLASSES.zinc) : COLOR_BADGE_CLASSES.zinc;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-medium text-zinc-900 dark:text-white truncate">{asset.name}</h3>
            <p className="text-xs text-zinc-500">
              {category?.name ?? "Unknown"}
              {asset.group && <span className="text-zinc-400 dark:text-zinc-600"> · {asset.group}</span>}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={onEdit}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-xl font-bold text-zinc-900 dark:text-white">
            {formatCurrency(asset.currentValue, asset.currency)}
          </p>
          {asset.quantity != null && asset.unitPrice != null && (
            <p className="text-xs text-zinc-500">
              {asset.quantity} × {formatCurrency(asset.unitPrice, asset.currency)}
            </p>
          )}
          {primaryCurrency && rates && asset.currency !== primaryCurrency && (
            <p className="text-xs text-zinc-500">
              ≈ {formatCurrency(convertCurrency(asset.currentValue, asset.currency, primaryCurrency, rates), primaryCurrency)}
            </p>
          )}
        </div>
        <div className="text-right">
          {asset.priceSource !== "manual" && (
            <div className="flex items-center gap-1 text-xs text-emerald-500 mb-0.5 justify-end">
              <RefreshCw className="h-3 w-3" />
              <span>Auto</span>
            </div>
          )}
          <p className="text-xs text-zinc-600">{formatDate(asset.updatedAt)}</p>
        </div>
      </div>
    </Card>
  );
}
