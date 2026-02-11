"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { uuid } from "@/lib/utils";
import type { Goal, Currency, Asset, Category } from "@/types";
import Button from "@/components/ui/Button";

interface GoalFormProps {
  goal?: Goal;
  categories: Category[];
  assets: Asset[];
  onClose: () => void;
}

export default function GoalForm({ goal, categories, assets, onClose }: GoalFormProps) {
  const [name, setName] = useState(goal?.name ?? "");
  const [amount, setAmount] = useState(goal?.amount?.toString() ?? "");
  const [currency, setCurrency] = useState<Currency | "">(goal?.currency ?? "");
  const [date, setDate] = useState(goal?.date ?? "");
  const [linkType, setLinkType] = useState<"" | "asset" | "category">(goal?.linkType ?? "");
  const [linkId, setLinkId] = useState(goal?.linkId ?? "");
  const [saving, setSaving] = useState(false);

  const selectClass =
    "w-full rounded-lg border border-[var(--dw-input-border)] bg-[var(--dw-input)] px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:text-white";

  // Group assets by category for the optgroup display
  const assetsByCategory = categories
    .map((cat) => ({
      category: cat,
      items: assets.filter((a) => a.categoryId === cat.id),
    }))
    .filter((g) => g.items.length > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !amount) return;

    setSaving(true);

    const settings = await db.settings.get("settings");
    const goals = settings?.goals ?? [];

    const newGoal: Goal = {
      id: goal?.id ?? uuid(),
      name: name.trim(),
      amount: Number(amount),
      currency: currency || undefined,
      date: date || undefined,
      linkType: linkType || undefined,
      linkId: linkType && linkId ? linkId : undefined,
    };

    if (goal) {
      const updated = goals.map((g) => (g.id === goal.id ? newGoal : g));
      await db.settings.update("settings", { goals: updated });
    } else {
      await db.settings.update("settings", { goals: [...goals, newGoal] });
    }

    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-400">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Retirement, House fund"
          className={selectClass}
          autoFocus
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-400">Target Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 1000000"
          className={selectClass}
          min={0}
          step="any"
        />
      </div>

      {/* Link picker */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-400">Track progress of</label>
        <select
          value={linkType}
          onChange={(e) => {
            setLinkType(e.target.value as "" | "asset" | "category");
            setLinkId("");
          }}
          className={selectClass}
        >
          <option value="">Net Worth</option>
          <option value="asset">Specific Asset</option>
          <option value="category">Category</option>
        </select>
      </div>

      {linkType === "asset" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">Asset</label>
          <select
            value={linkId}
            onChange={(e) => setLinkId(e.target.value)}
            className={selectClass}
          >
            <option value="">Select an asset…</option>
            {assetsByCategory.map((g) => (
              <optgroup key={g.category.id} label={g.category.name}>
                {g.items.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      )}

      {linkType === "category" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">Category</label>
          <select
            value={linkId}
            onChange={(e) => setLinkId(e.target.value)}
            className={selectClass}
          >
            <option value="">Select a category…</option>
            {categories.map((cat) => {
              const count = assets.filter((a) => a.categoryId === cat.id).length;
              return (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({count} {count === 1 ? "asset" : "assets"})
                </option>
              );
            })}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-400">Currency</label>
        <p className="text-xs text-zinc-500 mb-2">Leave empty to use your primary currency</p>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency | "")}
          className={`${selectClass} w-32`}
        >
          <option value="">Default</option>
          <option value="CZK">CZK</option>
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-400">Target Date</label>
        <p className="text-xs text-zinc-500 mb-2">Optional — enables on-track indicator</p>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={selectClass}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="text-xs px-3 py-1.5">
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !name.trim() || !amount} className="text-xs px-3 py-1.5">
          {goal ? "Save" : "Add"}
        </Button>
      </div>
    </form>
  );
}
