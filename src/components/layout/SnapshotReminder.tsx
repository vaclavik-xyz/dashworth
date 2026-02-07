"use client";

import { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { Camera, X } from "lucide-react";
import { db } from "@/lib/db";

const DAY_MS = 24 * 60 * 60 * 1000;

export default function SnapshotReminder() {
  const [dismissed, setDismissed] = useState(false);
  const settings = useLiveQuery(() => db.settings.get("settings"));
  const latestSnapshot = useLiveQuery(() =>
    db.snapshots.orderBy("date").reverse().first(),
  );

  if (dismissed || !settings) return null;

  // Don't show if auto-snapshot is enabled
  if (settings.autoSnapshot !== "off") return null;

  // Don't show if reminders are off
  if (settings.snapshotReminder === "none") return null;

  const thresholdDays = settings.snapshotReminder === "weekly" ? 7 : 30;
  const now = Date.now();

  // No snapshot ever taken
  const noSnapshots = latestSnapshot === undefined;

  if (!noSnapshots) {
    const lastDate = new Date(latestSnapshot.date).getTime();
    const daysSince = Math.floor((now - lastDate) / DAY_MS);
    if (daysSince < thresholdDays) return null;
  }

  const daysSince = noSnapshots
    ? null
    : Math.floor((now - new Date(latestSnapshot.date).getTime()) / DAY_MS);

  const message = noSnapshots
    ? "You haven't taken a snapshot yet. Capture your portfolio now."
    : `Last snapshot was ${daysSince} day${daysSince !== 1 ? "s" : ""} ago. Time to update your portfolio.`;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
      <Camera className="h-5 w-5 shrink-0 text-amber-500" />
      <p className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">
        {message}
      </p>
      <Link
        href="/snapshots"
        className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors"
      >
        Take Snapshot
      </Link>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setDismissed(true);
        }}
        className="shrink-0 rounded p-1 text-zinc-400 hover:text-zinc-300 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
