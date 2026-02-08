"use client";

import { useExampleData } from "@/contexts/ExampleDataContext";
import SnapshotCard from "@/components/snapshots/SnapshotCard";

export default function ExampleSnapshotsPage() {
  const data = useExampleData();

  if (!data) return <p className="text-zinc-500">Portfolio not found.</p>;

  const { snapshots } = data;

  return (
    <>
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Snapshots</h2>
      <p className="mt-1 text-sm text-zinc-500">
        {snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""} over time
      </p>

      <div className="mt-6 space-y-3">
        {snapshots.map((snapshot, index) => (
          <SnapshotCard
            key={snapshot.id}
            snapshot={snapshot}
            previousSnapshot={snapshots[index + 1]}
          />
        ))}
      </div>
    </>
  );
}
