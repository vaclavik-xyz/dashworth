"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { uuid, formatCurrency } from "@/lib/utils";
import type { Currency } from "@/types";
import Button from "@/components/ui/Button";

interface AssetRow {
  assetId: string;
  assetName: string;
  categoryId: string;
  value: string;
  currency: Currency;
}

interface TakeSnapshotFormProps {
  onClose: () => void;
}

export default function TakeSnapshotForm({ onClose }: TakeSnapshotFormProps) {
  const assets = useLiveQuery(() =>
    db.assets.filter((a) => !a.isArchived).toArray()
  );
  const settings = useLiveQuery(() => db.settings.get("settings"));

  const [rows, setRows] = useState<AssetRow[] | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Initialize rows from assets on first render when data arrives
  if (assets && rows === null) {
    const initial: AssetRow[] = assets.map((a) => ({
      assetId: a.id,
      assetName: a.name,
      categoryId: a.categoryId,
      value: a.currentValue.toString(),
      currency: a.currency,
    }));
    setRows(initial);
  }

  const primaryCurrency: Currency = settings?.primaryCurrency ?? "CZK";

  const totalNetWorth =
    rows?.reduce((sum, r) => sum + (Number(r.value) || 0), 0) ?? 0;

  function updateValue(index: number, value: string) {
    setRows((prev) =>
      prev ? prev.map((r, i) => (i === index ? { ...r, value } : r)) : prev
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rows) return;

    setSaving(true);
    const now = new Date();

    const entries = rows.map((r) => ({
      assetId: r.assetId,
      assetName: r.assetName,
      categoryId: r.categoryId,
      value: Number(r.value) || 0,
      currency: r.currency as string,
    }));

    await db.transaction("rw", db.snapshots, db.settings, async () => {
      await db.snapshots.add({
        id: uuid(),
        date: now,
        entries,
        totalNetWorth,
        primaryCurrency,
        note: note.trim() || undefined,
        createdAt: now,
      });
      await db.settings.update("settings", { lastSnapshotDate: now });
    });

    onClose();
  }

  if (!assets || !rows) {
    return <p className="text-sm text-zinc-500">Loading assets...</p>;
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-zinc-400">
          No active assets to snapshot. Add some assets first.
        </p>
        <Button variant="secondary" onClick={onClose} className="mt-4">
          Close
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
        {rows.map((row, i) => (
          <div
            key={row.assetId}
            className="flex items-center justify-between gap-3 rounded-lg bg-zinc-800 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {row.assetName}
              </p>
              <p className="text-xs text-zinc-500">{row.currency}</p>
            </div>
            <input
              type="number"
              value={row.value}
              onChange={(e) => updateValue(i, e.target.value)}
              className="w-28 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-right text-sm text-white focus:border-emerald-500 focus:outline-none"
              step="any"
              min="0"
            />
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-zinc-800/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Total</span>
          <span className="text-lg font-bold text-white">
            {formatCurrency(totalNetWorth, primaryCurrency)}
          </span>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-400">
          Note (optional)
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder='e.g. "After selling apartment"'
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          Save Snapshot
        </Button>
      </div>
    </form>
  );
}
