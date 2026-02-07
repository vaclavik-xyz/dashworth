"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import type { Snapshot, Currency } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import Card from "@/components/ui/Card";

interface SnapshotCardProps {
  snapshot: Snapshot;
  previousSnapshot?: Snapshot;
  onDelete: () => void;
}

export default function SnapshotCard({ snapshot, previousSnapshot, onDelete }: SnapshotCardProps) {
  const [expanded, setExpanded] = useState(false);

  const currency = snapshot.primaryCurrency as Currency;
  const change = previousSnapshot
    ? snapshot.totalNetWorth - previousSnapshot.totalNetWorth
    : null;
  const changePercent =
    change !== null && previousSnapshot && previousSnapshot.totalNetWorth !== 0
      ? (change / previousSnapshot.totalNetWorth) * 100
      : null;

  return (
    <Card>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-zinc-400">
              {formatDate(snapshot.date)}
            </p>
            <span className="text-xs text-zinc-600">
              {snapshot.entries.length} asset{snapshot.entries.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="mt-1 text-xl font-bold text-white">
            {formatCurrency(snapshot.totalNetWorth, currency)}
          </p>

          {change !== null && (
            <div className="mt-1 flex items-center gap-1.5">
              {change >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-400" />
              )}
              <span
                className={`text-xs font-medium ${
                  change >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {change >= 0 ? "+" : ""}
                {formatCurrency(change, currency)}
                {changePercent !== null && (
                  <> ({change >= 0 ? "+" : ""}{changePercent.toFixed(1)}%)</>
                )}
              </span>
            </div>
          )}

          {snapshot.note && (
            <p className="mt-1 text-xs text-zinc-500 italic">{snapshot.note}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 pt-1">
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.stopPropagation();
                onDelete();
              }
            }}
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-800 hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-zinc-600" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-600" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-3 border-t border-zinc-800 pt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-500">
                <th className="pb-2 font-medium">Asset</th>
                <th className="pb-2 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.entries.map((entry) => (
                <tr key={entry.assetId} className="border-t border-zinc-800/50">
                  <td className="py-1.5 text-zinc-300">{entry.assetName}</td>
                  <td className="py-1.5 text-right text-white">
                    {formatCurrency(entry.value, entry.currency as Currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
