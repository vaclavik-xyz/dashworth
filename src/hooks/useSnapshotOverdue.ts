import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

const DAY_MS = 24 * 60 * 60 * 1000;

export function useSnapshotOverdue(): {
  isOverdue: boolean;
  daysSinceLastSnapshot: number;
} {
  const settings = useLiveQuery(() => db.settings.get("settings"));
  const latestSnapshot = useLiveQuery(() =>
    db.snapshots.orderBy("date").reverse().first(),
  );

  if (!settings || settings.snapshotReminder === "none") {
    return { isOverdue: false, daysSinceLastSnapshot: 0 };
  }

  // Auto-snapshot handles it — don't nag
  if (settings.autoSnapshot !== "off") {
    return { isOverdue: false, daysSinceLastSnapshot: 0 };
  }

  const thresholdDays = settings.snapshotReminder === "weekly" ? 7 : 30;

  // No snapshot ever taken
  if (latestSnapshot === undefined) {
    return { isOverdue: true, daysSinceLastSnapshot: 0 };
  }

  const daysSince = Math.floor(
    (Date.now() - new Date(latestSnapshot.date).getTime()) / DAY_MS,
  );

  return {
    isOverdue: daysSince >= thresholdDays,
    daysSinceLastSnapshot: daysSince,
  };
}
