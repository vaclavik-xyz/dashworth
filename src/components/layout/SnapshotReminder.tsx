"use client";

import { useState } from "react";
import Link from "next/link";
import { Camera, X } from "lucide-react";
import { useSnapshotOverdue } from "@/hooks/useSnapshotOverdue";

const DISMISS_KEY = "dw-snapshot-reminder-dismissed";

function isDismissedToday(): boolean {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    const dismissedDate = new Date(Number(ts)).toDateString();
    return dismissedDate === new Date().toDateString();
  } catch {
    return false;
  }
}

export default function SnapshotReminder() {
  const [dismissed, setDismissed] = useState(isDismissedToday);
  const { isOverdue, daysSinceLastSnapshot } = useSnapshotOverdue();

  if (dismissed || !isOverdue) return null;

  const message =
    daysSinceLastSnapshot === 0
      ? "You haven't taken a snapshot yet. Capture your portfolio now."
      : `You haven't taken a snapshot in ${daysSinceLastSnapshot} day${daysSinceLastSnapshot !== 1 ? "s" : ""}. Time to update your portfolio.`;

  function handleDismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch { /* ignore */ }
    setDismissed(true);
  }

  return (
    <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
      <Camera className="h-5 w-5 shrink-0 text-amber-500" />
      <p className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">
        {message}
      </p>
      <Link
        href="/snapshots"
        className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors"
      >
        Take Snapshot &rarr;
      </Link>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 rounded p-1 text-zinc-400 hover:text-zinc-300 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
