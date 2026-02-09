"use client";

import { useState, useEffect, useRef } from "react";
import { X, Settings } from "lucide-react";
import { formatCurrency, HIDDEN_VALUE } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import { COLOR_BADGE_CLASSES } from "@/constants/colors";
import PriceSourceBadge from "@/components/ui/PriceSourceBadge";
import QuickUpdateForm from "@/components/assets/QuickUpdateForm";
import { usePrivacy } from "@/contexts/PrivacyContext";
import type { Asset, Category, Currency } from "@/types";

interface QuickUpdateModalProps {
  asset: Asset | null;
  category: Category | undefined;
  currency: Currency;
  rates: Record<string, number>;
  onClose: () => void;
  onViewDetails: (id: string) => void;
  onSettings: (id: string) => void;
}

export default function QuickUpdateModal({
  asset,
  category,
  currency,
  rates,
  onClose,
  onViewDetails,
  onSettings,
}: QuickUpdateModalProps) {
  const { hidden } = usePrivacy();
  const [noteOpen, setNoteOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const open = asset !== null;

  // Animate in
  useEffect(() => {
    if (open) {
      setNoteOpen(false);
      // Trigger animation on next frame
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  // Lock body scroll + Escape key
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const Icon = getIcon(asset.icon ?? category?.icon ?? "box");
  const colorClass = category
    ? (COLOR_BADGE_CLASSES[category.color] ?? COLOR_BADGE_CLASSES.zinc)
    : COLOR_BADGE_CLASSES.zinc;
  const isAuto = asset.priceSource !== "manual";

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 md:hidden transition-opacity duration-150 ${
        visible ? "bg-black/60 opacity-100" : "bg-black/0 opacity-0"
      }`}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className={`w-full max-w-[400px] rounded-2xl bg-[var(--dw-card)] border border-[var(--dw-border)] shadow-2xl p-5 transition-all duration-200 ease-out ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {/* Close button */}
        <div className="flex justify-end -mt-1 -mr-1 mb-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Asset header */}
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-900 dark:text-white truncate">{asset.name}</span>
              <PriceSourceBadge source={asset.priceSource} size="sm" />
            </div>
            <p className="text-xl font-bold text-zinc-900 dark:text-white">
              {hidden ? HIDDEN_VALUE : formatCurrency(asset.currentValue, asset.currency)}
            </p>
            {isAuto && asset.unitPrice && asset.ticker && (
              <p className="text-sm text-zinc-400">
                1 {asset.ticker.toUpperCase()} = {formatCurrency(asset.unitPrice, asset.currency)}
              </p>
            )}
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-zinc-700/50 my-4" />

        {/* Quick update form */}
        <QuickUpdateForm
          asset={asset}
          currency={currency}
          rates={rates}
          noteOpen={noteOpen}
          onNoteToggle={() => setNoteOpen((v) => !v)}
        />

        {/* + Add note (when not already open) */}
        {!noteOpen && (
          <button
            type="button"
            onClick={() => setNoteOpen(true)}
            className="mt-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            + Add note
          </button>
        )}

        {/* Separator */}
        <div className="border-t border-zinc-700/50 my-4" />

        {/* Bottom actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => onSettings(asset.id)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => onViewDetails(asset.id)}
            className="text-sm text-zinc-300 hover:text-white transition-colors"
          >
            View details &rsaquo;
          </button>
        </div>
      </div>
    </div>
  );
}
