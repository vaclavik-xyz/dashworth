"use client";

import { useEffect } from "react";
import { Settings } from "lucide-react";
import type { Asset, AssetChangeEntry, Category, Currency } from "@/types";
import { formatCurrency, HIDDEN_VALUE } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import { COLOR_BADGE_CLASSES } from "@/constants/colors";
import Card from "@/components/ui/Card";
import { usePrivacy } from "@/contexts/PrivacyContext";
import PriceSourceBadge from "@/components/ui/PriceSourceBadge";
import QuickUpdateForm from "./QuickUpdateForm";

interface AssetCardProps {
  asset: Asset;
  category?: Category;
  latestChange?: AssetChangeEntry;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onViewDetails: () => void;
  onSettings: () => void;
  currency: Currency;
  rates: Record<string, number>;
}

export default function AssetCard({
  asset,
  category,
  latestChange,
  isExpanded,
  onToggleExpand,
  onViewDetails,
  onSettings,
  currency,
  rates,
}: AssetCardProps) {
  const { hidden } = usePrivacy();
  const Icon = getIcon(asset.icon ?? category?.icon ?? "box");
  const colorClass = category ? (COLOR_BADGE_CLASSES[category.color] ?? COLOR_BADGE_CLASSES.zinc) : COLOR_BADGE_CLASSES.zinc;
  const isAuto = asset.priceSource !== "manual";

  const pctChange = latestChange && latestChange.oldValue !== 0
    ? ((latestChange.newValue - latestChange.oldValue) / latestChange.oldValue) * 100
    : null;

  // Escape key collapses
  useEffect(() => {
    if (!isExpanded) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onToggleExpand();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isExpanded, onToggleExpand]);

  return (
    <Card className="overflow-hidden">
      {/* Header area — clickable */}
      <div
        className="cursor-pointer"
        onClick={onToggleExpand}
      >
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
        {/* Row 2: Quantity/Category + actions or % change */}
        <div className="mt-1 flex items-center justify-between pl-11">
          <span className="text-xs text-zinc-500 truncate">
            {isAuto && asset.quantity != null && asset.ticker
              ? `${asset.quantity.toLocaleString()} ${asset.ticker.toUpperCase()}`
              : category?.name ?? "Unknown"}
          </span>
          {isExpanded ? (
            <div className="flex items-center gap-3 shrink-0 ml-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSettings();
                }}
                aria-label="Edit asset"
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails();
                }}
                className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                View details &rsaquo;
              </button>
            </div>
          ) : (
            isAuto && pctChange !== null && (
              <span className={`text-xs font-medium shrink-0 ml-2 ${pctChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {pctChange >= 0 ? "+" : ""}{pctChange.toFixed(1)}% {pctChange >= 0 ? "↑" : "↓"}
              </span>
            )
          )}
        </div>
      </div>

      {/* Expanded area — CSS grid-rows animation (desktop only) */}
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="transition-opacity duration-150"
            style={{
              opacity: isExpanded ? 1 : 0,
              transitionDelay: isExpanded ? "75ms" : "0ms",
            }}
          >
            {/* Separator */}
            <div className="border-t border-[var(--dw-border)] mt-2.5" />

            {/* Quick update form */}
            <QuickUpdateForm
              asset={asset}
              currency={currency}
              rates={rates}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
