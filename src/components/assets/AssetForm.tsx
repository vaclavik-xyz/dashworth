"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { uuid } from "@/lib/utils";
import type { Asset, Currency } from "@/types";
import Button from "@/components/ui/Button";

interface AssetFormProps {
  asset?: Asset;
  onClose: () => void;
}

export default function AssetForm({ asset, onClose }: AssetFormProps) {
  const categories = useLiveQuery(() => db.categories.orderBy("sortOrder").toArray());

  const [name, setName] = useState(asset?.name ?? "");
  const [categoryId, setCategoryId] = useState(asset?.categoryId ?? "");
  const [currentValue, setCurrentValue] = useState(asset?.currentValue?.toString() ?? "");
  const [currency, setCurrency] = useState<Currency>(asset?.currency ?? "CZK");
  const [notes, setNotes] = useState(asset?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !categoryId) return;

    setSaving(true);
    const now = new Date();

    if (asset) {
      await db.assets.update(asset.id, {
        name: name.trim(),
        categoryId,
        currentValue: Number(currentValue) || 0,
        currency,
        notes: notes.trim() || undefined,
        updatedAt: now,
      });
    } else {
      await db.assets.add({
        id: uuid(),
        name: name.trim(),
        categoryId,
        currentValue: Number(currentValue) || 0,
        currency,
        notes: notes.trim() || undefined,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    onClose();
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Bitcoin, Apartment Prague 6"
          className={inputClass}
          required
          autoFocus
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={inputClass}
          required
        >
          <option value="">Select category...</option>
          {categories?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">Value</label>
          <input
            type="number"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            placeholder="0"
            className={inputClass}
            min="0"
            step="any"
          />
        </div>
        <div className="w-28">
          <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className={inputClass}
          >
            <option value="CZK">CZK</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes..."
          className={`${inputClass} resize-none`}
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !name.trim() || !categoryId}>
          {asset ? "Save Changes" : "Add Asset"}
        </Button>
      </div>
    </form>
  );
}
