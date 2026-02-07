"use client";

import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { uuid, formatCurrency } from "@/lib/utils";
import { convertCurrency } from "@/lib/exchange-rates";
import { useExchangeRates } from "@/lib/useExchangeRates";
import { getIcon } from "@/lib/icons";
import type { Category, Currency } from "@/types";
import Button from "@/components/ui/Button";

interface AssetRow {
  assetId: string;
  assetName: string;
  categoryId: string;
  group?: string;
  value: string;
  currency: Currency;
}

interface GroupedRows {
  categoryId: string;
  category: Category | undefined;
  groups: {
    name: string | null;
    rows: { row: AssetRow; index: number }[];
    subtotal: number;
  }[];
  subtotal: number;
}

const COLOR_CLASSES: Record<string, string> = {
  orange: "text-orange-500",
  blue: "text-blue-500",
  emerald: "text-emerald-500",
  purple: "text-purple-500",
  red: "text-red-500",
  green: "text-green-500",
  slate: "text-slate-500",
  amber: "text-amber-500",
  zinc: "text-zinc-500",
};

interface TakeSnapshotFormProps {
  onClose: () => void;
}

export default function TakeSnapshotForm({ onClose }: TakeSnapshotFormProps) {
  const assets = useLiveQuery(() =>
    db.assets.filter((a) => !a.isArchived).toArray()
  );
  const categories = useLiveQuery(() => db.categories.orderBy("sortOrder").toArray());
  const settings = useLiveQuery(() => db.settings.get("settings"));

  const { rates } = useExchangeRates();
  const [rows, setRows] = useState<AssetRow[] | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Initialize rows from assets on first render when data arrives
  if (assets && rows === null) {
    const initial: AssetRow[] = assets.map((a) => ({
      assetId: a.id,
      assetName: a.name,
      categoryId: a.categoryId,
      group: a.group,
      value: a.currentValue.toString(),
      currency: a.currency,
    }));
    setRows(initial);
  }

  const primaryCurrency: Currency = settings?.primaryCurrency ?? "CZK";

  const totalNetWorth =
    rows?.reduce((sum, r) => sum + convertCurrency(Number(r.value) || 0, r.currency, primaryCurrency, rates), 0) ?? 0;

  // Build grouped structure for display
  const sections = useMemo(() => {
    if (!rows || !categories) return [];
    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const byCat = new Map<string, { row: AssetRow; index: number }[]>();

    rows.forEach((row, index) => {
      const list = byCat.get(row.categoryId) ?? [];
      list.push({ row, index });
      byCat.set(row.categoryId, list);
    });

    const sortedCatIds = [...byCat.keys()].sort((a, b) => {
      const ca = categoryMap.get(a);
      const cb = categoryMap.get(b);
      return (ca?.sortOrder ?? 99) - (cb?.sortOrder ?? 99);
    });

    return sortedCatIds.map((catId): GroupedRows => {
      const catRows = byCat.get(catId)!;
      const category = categoryMap.get(catId);

      const byGroup = new Map<string | null, { row: AssetRow; index: number }[]>();
      for (const item of catRows) {
        const key = item.row.group ?? null;
        const list = byGroup.get(key) ?? [];
        list.push(item);
        byGroup.set(key, list);
      }

      const groupNames = [...byGroup.keys()].filter((k) => k !== null).sort() as string[];
      const hasUngrouped = byGroup.has(null);

      const groups = [
        ...groupNames.map((name) => {
          const items = byGroup.get(name)!;
          return {
            name: name as string | null,
            rows: items,
            subtotal: items.reduce((s, item) => s + (Number(item.row.value) || 0), 0),
          };
        }),
        ...(hasUngrouped
          ? [{
              name: null as string | null,
              rows: byGroup.get(null)!,
              subtotal: byGroup.get(null)!.reduce((s, item) => s + (Number(item.row.value) || 0), 0),
            }]
          : []),
      ];

      return {
        categoryId: catId,
        category,
        groups,
        subtotal: catRows.reduce((s, item) => s + (Number(item.row.value) || 0), 0),
      };
    });
  }, [rows, categories]);

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
      group: r.group,
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

  if (!assets || !rows || !categories) {
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
      <div className="max-h-64 overflow-y-auto space-y-4 pr-1">
        {sections.map((section) => {
          const Icon = section.category ? getIcon(section.category.icon) : null;
          const colorClass = section.category
            ? (COLOR_CLASSES[section.category.color] ?? "text-zinc-500")
            : "text-zinc-500";

          return (
            <div key={section.categoryId}>
              <div className="flex items-center gap-2 mb-2">
                {Icon && <Icon className={`h-4 w-4 ${colorClass}`} />}
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {section.category?.name ?? "Unknown"}
                </span>
              </div>
              <div className="space-y-2">
                {section.groups.map((grp, gi) => (
                  <div key={grp.name ?? `ungrouped-${gi}`}>
                    {grp.name && (
                      <p className="text-xs text-zinc-500 ml-1 mb-1">{grp.name}</p>
                    )}
                    {grp.rows.map(({ row, index }) => (
                      <div
                        key={row.assetId}
                        className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                            {row.assetName}
                          </p>
                          <p className="text-xs text-zinc-500">{row.currency}</p>
                        </div>
                        <input
                          type="number"
                          value={row.value}
                          onChange={(e) => updateValue(index, e.target.value)}
                          className="w-28 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-right text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                          step="any"
                          min="0"
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Total</span>
          <span className="text-lg font-bold text-zinc-900 dark:text-white">
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
          className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
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
