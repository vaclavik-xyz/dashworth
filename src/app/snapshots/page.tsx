"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Camera, Plus } from "lucide-react";
import { db } from "@/lib/db";
import type { Snapshot } from "@/types";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import TakeSnapshotForm from "@/components/snapshots/TakeSnapshotForm";
import SnapshotCard from "@/components/snapshots/SnapshotCard";

export default function SnapshotsPage() {
  const snapshots = useLiveQuery(() =>
    db.snapshots.orderBy("date").reverse().toArray()
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Snapshot | null>(null);

  async function confirmDelete() {
    if (!deleteTarget) return;
    await db.snapshots.delete(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Snapshots</h1>
        {snapshots && snapshots.length > 0 && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Take Snapshot
          </Button>
        )}
      </div>

      {/* Snapshot list or empty state */}
      {snapshots && snapshots.length === 0 ? (
        <div className="mt-20 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
            <Camera className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">
            No snapshots yet
          </h2>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">
            Snapshots freeze your asset values at a point in time. Take them
            regularly to track how your net worth changes over weeks and months.
          </p>
          <Button onClick={() => setModalOpen(true)} className="mt-6">
            <Camera className="h-4 w-4" />
            Take Your First Snapshot
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {snapshots?.map((snapshot, index) => (
            <SnapshotCard
              key={snapshot.id}
              snapshot={snapshot}
              previousSnapshot={snapshots[index + 1]}
              onDelete={() => setDeleteTarget(snapshot)}
            />
          ))}
        </div>
      )}

      {/* Take snapshot modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Take Snapshot"
      >
        <TakeSnapshotForm onClose={() => setModalOpen(false)} />
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete Snapshot"
      >
        <p className="text-sm text-zinc-400">
          Are you sure you want to delete this snapshot? This action cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
