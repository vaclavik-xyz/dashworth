"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { db } from "@/lib/db";
import { uuid } from "@/lib/utils";
import { PALETTE_COLORS, COLOR_BG_CLASSES } from "@/constants/colors";
import type { Goal, Currency, Asset, Category } from "@/types";
import Button from "@/components/ui/Button";

const GOAL_TYPE_DEFAULT_COLORS: Record<string, string> = {
  "": "emerald",
  asset: "sky",
  category: "purple",
};

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
  const [color, setColor] = useState(goal?.color ?? GOAL_TYPE_DEFAULT_COLORS[goal?.linkType ?? ""] ?? "emerald");
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

  const isLiabilityGoal = (() => {
    if (linkType === "category" && linkId) {
      return categories.find((c) => c.id === linkId)?.isLiability ?? false;
    }
    if (linkType === "asset" && linkId) {
      const asset = assets.find((a) => a.id === linkId);
      if (!asset) return false;
      return categories.find((c) => c.id === asset.categoryId)?.isLiability ?? false;
    }
    return false;
  })();

  useEffect(() => {
    if (isLiabilityGoal && !amount) setAmount("0");
  }, [isLiabilityGoal]);

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
      color,
      // Preserve completion fields when editing
      ...(goal?.reachedAt && { reachedAt: goal.reachedAt }),
      ...(goal?.celebratedAt && { celebratedAt: goal.celebratedAt }),
      ...(goal?.hidden && { hidden: goal.hidden }),
      // Preserve initialValue for liability goals (only if link unchanged)
      ...(goal?.initialValue != null &&
        goal?.linkType === (linkType || undefined) &&
        goal?.linkId === (linkType && linkId ? linkId : undefined) && {
          initialValue: goal.initialValue,
        }),
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
        <label className="mb-1 block text-sm font-medium text-zinc-400">
          {isLiabilityGoal ? "Target Balance" : "Target Amount"}
        </label>
        {isLiabilityGoal && (
          <p className="text-xs text-zinc-500 mb-2">
            The balance you want to reduce this debt to (0 = pay off completely)
          </p>
        )}
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={isLiabilityGoal ? "e.g. 0" : "e.g. 1000000"}
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
            const newType = e.target.value as "" | "asset" | "category";
            setLinkType(newType);
            setLinkId("");
            // Update color to type default if current color is a type default
            const typeDefaults = Object.values(GOAL_TYPE_DEFAULT_COLORS);
            if (typeDefaults.includes(color)) {
              setColor(GOAL_TYPE_DEFAULT_COLORS[newType] ?? "emerald");
            }
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
            {categories
              .filter((cat) => assets.some((a) => a.categoryId === cat.id))
              .map((cat) => {
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

      {/* Color picker */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-400">Color</label>
        <div className="grid grid-cols-8 gap-2">
          {PALETTE_COLORS.map((c) => {
            const isSelected = color === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                  COLOR_BG_CLASSES[c] ?? "bg-zinc-500"
                } ${isSelected ? "ring-2 ring-offset-2 ring-offset-zinc-900 ring-white/60 scale-110" : "hover:scale-105"}`}
              >
                {isSelected && <Check className="h-4 w-4 text-white" />}
              </button>
            );
          })}
        </div>
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
