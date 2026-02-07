"use client";

import Link from "next/link";
import { Camera } from "lucide-react";
import type { Currency, Snapshot } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import Card from "@/components/ui/Card";

interface RecentActivityProps {
  snapshots: Snapshot[];
  currency: Currency;
}

export default function RecentActivity({ snapshots, currency }: RecentActivityProps) {
  if (snapshots.length === 0) return null;

  const recent = snapshots.slice(0, 3);

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-400">Recent Snapshots</h2>
        <Link
          href="/snapshots"
          className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
        >
          View all
        </Link>
      </div>
      <div className="space-y-2">
        {recent.map((snapshot) => (
          <div
            key={snapshot.id}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <Camera className="h-4 w-4 shrink-0 text-zinc-600" />
              <span className="text-sm text-zinc-400">
                {formatDate(snapshot.date)}
              </span>
            </div>
            <span className="text-sm font-medium text-white">
              {formatCurrency(snapshot.totalNetWorth, currency)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
