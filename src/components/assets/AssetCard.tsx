"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { Asset, Category, Currency } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { convertCurrency } from "@/lib/exchange-rates";
import { getIcon } from "@/lib/icons";
import Card from "@/components/ui/Card";

const COLOR_CLASSES: Record<string, string> = {
  orange: "bg-orange-500/15 text-orange-400",
  blue: "bg-blue-500/15 text-blue-400",
  emerald: "bg-emerald-500/15 text-emerald-400",
  purple: "bg-purple-500/15 text-purple-400",
  red: "bg-red-500/15 text-red-400",
  green: "bg-green-500/15 text-green-400",
  slate: "bg-slate-500/15 text-slate-400",
  amber: "bg-amber-500/15 text-amber-400",
  zinc: "bg-zinc-500/15 text-zinc-400",
};

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
  const colorClass = category ? (COLOR_CLASSES[category.color] ?? COLOR_CLASSES.zinc) : COLOR_CLASSES.zinc;

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
          {primaryCurrency && rates && asset.currency !== primaryCurrency && (
            <p className="text-xs text-zinc-500">
              ≈ {formatCurrency(convertCurrency(asset.currentValue, asset.currency, primaryCurrency, rates), primaryCurrency)}
            </p>
          )}
        </div>
        <p className="text-xs text-zinc-600">{formatDate(asset.updatedAt)}</p>
      </div>
    </Card>
  );
}
