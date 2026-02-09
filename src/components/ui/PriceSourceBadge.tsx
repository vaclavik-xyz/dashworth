"use client";

import { Zap, Pencil } from "lucide-react";
import type { PriceSource } from "@/types";

interface PriceSourceBadgeProps {
  source: PriceSource;
  showLabel?: boolean;
  size?: "sm" | "md";
}

const SOURCE_LABELS: Record<string, string> = {
  coingecko: "Auto price",
  yahoo: "Auto price",
  manual: "Manual",
};

export default function PriceSourceBadge({
  source,
  showLabel = false,
  size = "md",
}: PriceSourceBadgeProps) {
  const isAuto = source !== "manual";
  const iconClass = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  if (isAuto) {
    return (
      <span className="inline-flex items-center gap-1">
        <Zap className={`${iconClass} text-emerald-400`} />
        {showLabel && (
          <span className="text-xs text-emerald-400">
            {SOURCE_LABELS[source] ?? "Auto price"}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <Pencil className={`${iconClass} text-zinc-500`} />
      {showLabel && <span className="text-xs text-zinc-500">Manual</span>}
    </span>
  );
}
