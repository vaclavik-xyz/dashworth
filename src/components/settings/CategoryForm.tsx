"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { uuid } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import { PALETTE_COLORS, COLOR_BADGE_CLASSES, COLOR_BG_CLASSES } from "@/constants/colors";
import type { Category } from "@/types";
import Button from "@/components/ui/Button";
import IconPicker from "@/components/ui/IconPicker";
import { Check } from "lucide-react";

interface CategoryFormProps {
  category?: Category;
  onClose: () => void;
}

export default function CategoryForm({ category, onClose }: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "box");
  const [color, setColor] = useState(category?.color ?? "emerald");
  const [isLiability, setIsLiability] = useState(category?.isLiability ?? false);
  const [saving, setSaving] = useState(false);

  const PreviewIcon = getIcon(icon);
  const badgeClass = COLOR_BADGE_CLASSES[color] ?? COLOR_BADGE_CLASSES.zinc;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);

    if (category) {
      await db.categories.update(category.id, {
        name: name.trim(),
        icon,
        color,
        isLiability,
      });
    } else {
      const maxSort = await db.categories.orderBy("sortOrder").last();
      await db.categories.add({
        id: uuid(),
        name: name.trim(),
        icon,
        color,
        isLiability,
        sortOrder: (maxSort?.sortOrder ?? -1) + 1,
        createdAt: new Date(),
      });
    }

    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Preview + actions at top */}
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${badgeClass}`}>
          <PreviewIcon className="h-5 w-5" />
        </div>
        <span className="flex-1 text-sm font-medium text-zinc-900 dark:text-white truncate">
          {name.trim() || "Category Name"}
        </span>
        <Button type="button" variant="secondary" onClick={onClose} className="text-xs px-3 py-1.5">
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !name.trim()} className="text-xs px-3 py-1.5">
          {category ? "Save" : "Add"}
        </Button>
      </div>

      {/* Name */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-400">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. NFTs, Real Estate"
          className="w-full rounded-lg border border-[var(--dw-input-border)] bg-[var(--dw-input)] px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none dark:text-white dark:placeholder-zinc-500"
          autoFocus
        />
      </div>

      {/* Icon picker — own scroll area */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-400">Icon</label>
        <IconPicker value={icon} onChange={setIcon} color={badgeClass} />
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

      {/* Liability toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-white">Liability / Debt</p>
          <p className="text-xs text-zinc-500">Subtracted from net worth</p>
        </div>
        <button
          type="button"
          onClick={() => setIsLiability(!isLiability)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
            isLiability ? "bg-red-500" : "bg-zinc-600"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              isLiability ? "translate-x-5.5" : "translate-x-0.5"
            } mt-0.5`}
          />
        </button>
      </div>

    </form>
  );
}
