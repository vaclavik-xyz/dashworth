"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

import { useLiveQuery } from "dexie-react-hooks";
import { Download, Upload, Trash2, Globe, Github, RefreshCw, Plus, Pencil, ChevronUp, ChevronDown, Monitor, Palette, Wallet, BarChart3, Shield, Info, Eye, Layers, Smartphone, Target, RotateCcw } from "lucide-react";
import { db } from "@/lib/db";
import { exportData } from "@/lib/export";
import { importData, validateImport, readJsonFile } from "@/lib/import";
import { seedDatabase } from "@/lib/seed";
import { useExchangeRates } from "@/lib/useExchangeRates";
import { convertCurrency } from "@/lib/exchange-rates";
import { formatDate, formatCurrency, calcNetWorth, HIDDEN_VALUE } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import { COLOR_BADGE_CLASSES } from "@/constants/colors";
import type { Category, Goal, Currency, CustomThemeColors, Theme, UserSettings } from "@/types";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import CategoryForm from "@/components/settings/CategoryForm";
import GoalForm from "@/components/settings/GoalForm";
import HintTooltip from "@/components/ui/HintTooltip";
import { usePrivacy } from "@/contexts/PrivacyContext";
import type { LucideIcon } from "lucide-react";

function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = false,
  titleRight,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  defaultOpen?: boolean;
  titleRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="mt-8">
      <div className="flex w-full items-center gap-2 group">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2"
        >
          {Icon && <Icon className="h-4 w-4 text-zinc-500" />}
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            {title}
          </h2>
          <ChevronDown
            className={`h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
        <div className="flex-1" />
        {titleRight}
      </div>
      <div className={`grid transition-all duration-200 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">{children}</div>
      </div>
    </section>
  );
}

function GuideItem({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--dw-border)] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:text-emerald-400"
      >
        <Icon className="h-4 w-4 shrink-0 text-emerald-500" />
        <span className="flex-1 text-sm font-medium text-zinc-900 dark:text-white">{title}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`grid transition-all duration-200 ${open ? "grid-rows-[1fr] pb-3" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <p className="pl-7 text-xs leading-relaxed text-zinc-500">{children}</p>
        </div>
      </div>
    </div>
  );
}

function goalBadgeClass(goal: Goal): string {
  const c = goal.color
    ?? (goal.linkType === "asset" ? "sky" : goal.linkType === "category" ? "purple" : "emerald");
  return COLOR_BADGE_CLASSES[c] ?? COLOR_BADGE_CLASSES.emerald;
}

export default function SettingsPage() {
  const router = useRouter();
  const settings = useLiveQuery(() => db.settings.get("settings"));
  const categories = useLiveQuery(() => db.categories.orderBy("sortOrder").toArray());
  const assets = useLiveQuery(() => db.assets.toArray());
  const { rates, refresh: refreshRates, lastUpdated } = useExchangeRates();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<unknown>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Category management state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<Category | null>(null);

  // Goal management state
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>();
  const [deleteGoalTarget, setDeleteGoalTarget] = useState<Goal | null>(null);

  const { hidden } = usePrivacy();
  const activeAssets = assets?.filter((a) => !a.isArchived) ?? [];
  const currency: Currency = settings?.primaryCurrency ?? "USD";

  const DEFAULT_CUSTOM_THEME: CustomThemeColors = {
    base: "dark",
    bg: "#1a1a2e",
    card: "#16213e",
    border: "#0f3460",
  };

  async function updateSetting<K extends "primaryCurrency" | "theme">(
    key: K,
    value: UserSettings[K],
  ) {
    await db.settings.update("settings", { [key]: value } as Pick<UserSettings, K>);
  }

  async function selectCustomTheme() {
    // Set defaults if no custom palette exists yet
    if (!settings?.customTheme) {
      await db.settings.update("settings", {
        theme: "custom",
        customTheme: DEFAULT_CUSTOM_THEME,
      });
    } else {
      await db.settings.update("settings", { theme: "custom" });
    }
  }

  async function updateCustomColor(key: keyof CustomThemeColors, value: string) {
    const current = settings?.customTheme ?? DEFAULT_CUSTOM_THEME;
    await db.settings.update("settings", {
      customTheme: { ...current, [key]: value },
    });
  }

  // Category helpers
  function assetCountFor(categoryId: string): number {
    return assets?.filter((a) => a.categoryId === categoryId && !a.isArchived).length ?? 0;
  }

  function openAddCategory() {
    setEditingCategory(undefined);
    setCategoryModalOpen(true);
  }

  function openEditCategory(cat: Category) {
    setEditingCategory(cat);
    setCategoryModalOpen(true);
  }

  function closeCategoryModal() {
    setCategoryModalOpen(false);
    setEditingCategory(undefined);
  }

  async function swapSortOrder(cat: Category, direction: "up" | "down") {
    if (!categories) return;
    const idx = categories.findIndex((c) => c.id === cat.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categories.length) return;

    const neighbor = categories[swapIdx];
    await db.transaction("rw", db.categories, async () => {
      await db.categories.update(cat.id, { sortOrder: neighbor.sortOrder });
      await db.categories.update(neighbor.id, { sortOrder: cat.sortOrder });
    });
  }

  async function confirmDeleteCategory() {
    if (!deleteCategoryTarget) return;
    await db.categories.delete(deleteCategoryTarget.id);
    setDeleteCategoryTarget(null);
  }

  // Goal helpers
  function openAddGoal() {
    setEditingGoal(undefined);
    setGoalModalOpen(true);
  }

  function openEditGoal(goal: Goal) {
    setEditingGoal(goal);
    setGoalModalOpen(true);
  }

  function closeGoalModal() {
    setGoalModalOpen(false);
    setEditingGoal(undefined);
  }

  async function confirmDeleteGoal() {
    if (!deleteGoalTarget) return;
    const goals = settings?.goals ?? [];
    await db.settings.update("settings", { goals: goals.filter((g) => g.id !== deleteGoalTarget.id) });
    setDeleteGoalTarget(null);
  }

  // Import flow
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    try {
      const data = await readJsonFile(file);
      if (!validateImport(data)) {
        setImportError("Invalid file format. Expected a Dashworth backup JSON.");
        return;
      }
      setPendingImport(data);
      setImportConfirmOpen(true);
    } catch {
      setImportError("Failed to read the file.");
    }
  }

  async function confirmImport() {
    if (!pendingImport || !validateImport(pendingImport)) return;
    await importData(pendingImport);
    setPendingImport(null);
    setImportConfirmOpen(false);
  }

  // Delete all flow
  async function confirmDeleteAll() {
    await db.transaction(
      "rw",
      [db.categories, db.assets, db.history, db.assetChanges, db.settings, db.exchangeRates, db.priceCache],
      async () => {
        await db.categories.clear();
        await db.assets.clear();
        await db.history.clear();
        await db.assetChanges.clear();
        await db.settings.clear();
        await db.exchangeRates.clear();
        await db.priceCache.clear();
      },
    );
    await seedDatabase();
    setDeleteModalOpen(false);
    setDeleteConfirmText("");
    router.push("/");
  }

  const selectClass =
    "w-full rounded-lg border border-[var(--dw-input-border)] bg-[var(--dw-input)] px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:text-white";

  if (!settings) return null;

  const deleteCategoryHasAssets = deleteCategoryTarget
    ? assetCountFor(deleteCategoryTarget.id) > 0
    : false;

  return (
    <div className="p-6 md:p-10">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Settings</h1>

      {/* General */}
      <CollapsibleSection title="General" icon={Globe}>
        <Card className="mt-3 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">Primary Currency</p>
              <p className="text-xs text-zinc-500">
                Used for net worth calculations
              </p>
            </div>
            <select
              value={settings.primaryCurrency}
              onChange={(e) =>
                updateSetting("primaryCurrency", e.target.value as Currency)
              }
              className={`${selectClass} w-24`}
            >
              <option value="CZK">CZK</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>

          {/* Exchange Rates */}
          <div className="rounded-lg bg-[var(--dw-hover)] px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">Exchange Rates</p>
              <button
                type="button"
                onClick={refreshRates}
                className="flex items-center gap-1.5 text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>
            <div className="space-y-1">
              {(["USD", "EUR", "CZK"] as Currency[])
                .filter((c) => c !== settings.primaryCurrency)
                .map((c) => (
                  <p key={c} className="text-xs text-zinc-500">
                    1 {c} = {convertCurrency(1, c, settings.primaryCurrency, rates).toFixed(2)} {settings.primaryCurrency}
                  </p>
                ))}
            </div>
            <p className="text-xs text-zinc-600">
              {lastUpdated
                ? `Updated ${formatDate(lastUpdated)}`
                : "Using offline rates"}
            </p>
          </div>
        </Card>
      </CollapsibleSection>

      {/* Theme */}
      <CollapsibleSection title="Theme" icon={Palette}>
        <Card className="mt-3">
          <div>
            <p className="text-xs text-zinc-500 mb-3">Appearance preference</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {([
                { value: "light" as Theme, label: "Light", bg: "#fafafa", card: "#ffffff", accent: "#10b981" },
                { value: "dark" as Theme, label: "Dark", bg: "#09090b", card: "#18181b", accent: "#10b981" },
                { value: "midnight" as Theme, label: "Midnight", bg: "#000000", card: "#0a0a0a", accent: "#10b981" },
                { value: "emerald-dark" as Theme, label: "Emerald", bg: "#022c22", card: "#04382b", accent: "#34d399" },
                { value: "system" as Theme, label: "System" },
                { value: "custom" as Theme, label: "Custom" },
              ]).map((t) => {
                const isActive = settings.theme === t.value;
                const customColors = settings.customTheme ?? DEFAULT_CUSTOM_THEME;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() =>
                      t.value === "custom"
                        ? selectCustomTheme()
                        : updateSetting("theme", t.value)
                    }
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-2.5 transition-all shrink-0 ${
                      isActive
                        ? "border-emerald-500 bg-emerald-500/5"
                        : "border-[var(--dw-border)] hover:border-zinc-400 dark:hover:border-zinc-500"
                    }`}
                  >
                    {t.value === "system" ? (
                      <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-gradient-to-r from-[#fafafa] to-[#09090b]">
                        <Monitor className="h-5 w-5 text-zinc-500" />
                      </div>
                    ) : t.value === "custom" ? (
                      <div
                        className="flex h-10 w-14 items-center justify-center rounded-lg"
                        style={{ backgroundColor: customColors.bg }}
                      >
                        <Palette className="h-5 w-5" style={{ color: customColors.border }} />
                      </div>
                    ) : (
                      <div
                        className="flex h-10 w-14 items-center justify-center gap-1 rounded-lg"
                        style={{ backgroundColor: t.bg }}
                      >
                        <div className="h-6 w-5 rounded" style={{ backgroundColor: t.card }} />
                        <div className="flex flex-col gap-0.5">
                          <div className="h-1.5 w-4 rounded-full" style={{ backgroundColor: t.accent, opacity: 0.8 }} />
                          <div className="h-1 w-3 rounded-full" style={{ backgroundColor: t.card }} />
                        </div>
                      </div>
                    )}
                    <span className={`text-[11px] font-medium ${isActive ? "text-emerald-500" : "text-zinc-500"}`}>
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom theme picker panel */}
            {settings.theme === "custom" && (
              <div className="mt-4 rounded-xl border border-[var(--dw-border)] bg-[var(--dw-hover)] p-4 space-y-4">
                <div>
                  <p className="text-xs font-medium text-zinc-400 mb-2">Base text mode</p>
                  <div className="flex gap-2">
                    {(["dark", "light"] as const).map((mode) => {
                      const active = (settings.customTheme ?? DEFAULT_CUSTOM_THEME).base === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => updateCustomColor("base", mode)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                            active
                              ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                              : "bg-[var(--dw-card)] text-zinc-400 border border-[var(--dw-border)] hover:text-zinc-200"
                          }`}
                        >
                          {mode === "dark" ? "Light text" : "Dark text"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {([
                  { key: "bg" as const, label: "Background" },
                  { key: "card" as const, label: "Card" },
                  { key: "border" as const, label: "Border" },
                ]).map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <p className="text-xs font-medium text-zinc-400">{label}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 font-mono">
                        {(settings.customTheme ?? DEFAULT_CUSTOM_THEME)[key]}
                      </span>
                      <input
                        type="color"
                        value={(settings.customTheme ?? DEFAULT_CUSTOM_THEME)[key]}
                        onChange={(e) => updateCustomColor(key, e.target.value)}
                        className="h-8 w-8 cursor-pointer rounded-lg border border-[var(--dw-border)] bg-transparent p-0.5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </CollapsibleSection>

      {/* Categories */}
      <CollapsibleSection
        title="Categories"
        icon={Layers}
        titleRight={
          <Button variant="ghost" onClick={openAddCategory} className="text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add Category
          </Button>
        }
      >
        <Card className="mt-3 p-0">
          {categories && categories.length > 0 ? (
            <div className="divide-y divide-[var(--dw-border)]">
              {categories.map((cat, idx) => {
                const Icon = getIcon(cat.icon);
                const badgeClass = COLOR_BADGE_CLASSES[cat.color] ?? COLOR_BADGE_CLASSES.zinc;
                const count = assetCountFor(cat.id);

                return (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    {/* Icon badge */}
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${badgeClass}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>

                    {/* Name + count */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white truncate flex items-center gap-1.5">
                        {cat.name}
                        {cat.isLiability && (
                          <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-400">debt</span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {count} {count === 1 ? "asset" : "assets"}
                      </p>
                    </div>

                    {/* Reorder arrows */}
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => swapSortOrder(cat, "up")}
                        disabled={idx === 0}
                        aria-label="Move up"
                        className="rounded p-0.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-colors"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => swapSortOrder(cat, "down")}
                        disabled={idx === (categories?.length ?? 0) - 1}
                        aria-label="Move down"
                        className="rounded p-0.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-colors"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => openEditCategory(cat)}
                      aria-label="Edit category"
                      className="rounded-lg p-2 text-zinc-400 hover:bg-[var(--dw-hover)] hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setDeleteCategoryTarget(cat)}
                      aria-label="Delete category"
                      className="rounded-lg p-2 text-zinc-400 hover:bg-[var(--dw-hover)] hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">
              No categories yet.
            </p>
          )}
        </Card>
      </CollapsibleSection>

      {/* Guide */}
      <CollapsibleSection title="Guide" icon={Info}>
        <Card className="mt-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">Show Hints</p>
              <p className="text-xs text-zinc-500">
                Display contextual help icons throughout the app
              </p>
            </div>
            <button
              type="button"
              onClick={() => db.settings.update("settings", { showHints: !(settings.showHints !== false) })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                settings.showHints !== false ? "bg-emerald-500" : "bg-zinc-600"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  settings.showHints !== false ? "translate-x-5.5" : "translate-x-0.5"
                } mt-0.5`}
              />
            </button>
          </div>

          <div className="mt-4 border-t border-[var(--dw-border)] pt-1 -mb-4">
            <GuideItem icon={Wallet} title="Getting Started">
              Go to <span className="text-zinc-300">Assets</span> and tap <span className="text-zinc-300">+ Add Asset</span>. Enter a name, pick a category, set the currency and current value. Your net worth is calculated and tracked automatically on the <span className="text-zinc-300">Dashboard</span>.
            </GuideItem>
            <GuideItem icon={RefreshCw} title="Live Price Tracking">
              Any asset can use auto-updating prices. When adding or editing an asset, set the price source to <span className="text-zinc-300">CoinGecko</span> (crypto) or <span className="text-zinc-300">Yahoo Finance</span> (stocks) and enter the ticker symbol (e.g. bitcoin, AAPL).
            </GuideItem>
            <GuideItem icon={Layers} title="Categories & Groups">
              Categories organize your assets by type (Crypto, Stocks, Real Estate, etc.). Groups are sub-folders within a category — e.g. multiple wallets under a &quot;Bitcoin&quot; group. Manage categories in Settings above.
            </GuideItem>
            <GuideItem icon={Eye} title="Privacy Mode">
              Tap the <span className="text-zinc-300">eye icon</span> on the Dashboard or Assets page to hide all financial values. Percentages remain visible. Useful when checking your portfolio in public.
            </GuideItem>
            <GuideItem icon={Download} title="Data & Backups">
              All data is stored locally in your browser (IndexedDB). Nothing is sent to any server. Use <span className="text-zinc-300">Export</span> below to create JSON backups. Use <span className="text-zinc-300">Import</span> to restore data or move to another device.
            </GuideItem>
            <GuideItem icon={Smartphone} title="Installing the App">
              Install Dashworth to your home screen for the best experience — it works offline, launches instantly, and keeps your data longer. On iOS Safari, tap <span className="text-zinc-300">Share → Add to Home Screen</span>.
            </GuideItem>
          </div>
        </Card>
      </CollapsibleSection>

      {/* Goals */}
      <CollapsibleSection
        title="Goals"
        icon={Target}
        titleRight={
          <Button variant="ghost" onClick={openAddGoal} className="text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add Goal
          </Button>
        }
      >
        {(() => {
          const activeGoals = settings.goals?.filter((g) => !g.hidden) ?? [];
          const completedGoals = settings.goals?.filter((g) => g.hidden) ?? [];

          return (
            <>
              <Card className="mt-3 p-0">
                {activeGoals.length > 0 ? (
                  <div className="divide-y divide-[var(--dw-border)]">
                    {activeGoals.map((goal) => (
                      <div key={goal.id} className="flex items-center gap-3 px-4 py-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${goalBadgeClass(goal)}`}>
                          <Target className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{goal.name}</p>
                          <p className="text-xs text-zinc-500">
                            {hidden ? HIDDEN_VALUE : formatCurrency(goal.amount, goal.currency ?? settings.primaryCurrency)}
                            {goal.date && ` · by ${new Date(goal.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
                            {goal.linkType && goal.linkId && (() => {
                              const linked = goal.linkType === "asset"
                                ? assets?.find((a) => a.id === goal.linkId)?.name
                                : categories?.find((c) => c.id === goal.linkId)?.name;
                              return linked
                                ? <> · {linked}</>
                                : <> · <span className="text-amber-400">broken link</span></>;
                            })()}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openEditGoal(goal)}
                          aria-label="Edit goal"
                          className="rounded-lg p-2 text-zinc-400 hover:bg-[var(--dw-hover)] hover:text-zinc-900 dark:hover:text-white transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteGoalTarget(goal)}
                          aria-label="Delete goal"
                          className="rounded-lg p-2 text-zinc-400 hover:bg-[var(--dw-hover)] hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 py-6 text-center text-sm text-zinc-500">
                    No active goals. Add one to track your progress.
                  </p>
                )}
              </Card>

              {completedGoals.length > 0 && (
                <>
                  <p className="mt-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Completed</p>
                  <Card className="mt-2 p-0">
                    <div className="divide-y divide-[var(--dw-border)]">
                      {completedGoals.map((goal) => (
                        <div key={goal.id} className="flex items-center gap-3 px-4 py-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg opacity-50 ${goalBadgeClass(goal)}`}>
                            <Target className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-zinc-500 truncate">{goal.name}</p>
                            <p className="text-xs text-zinc-600">
                              {hidden ? HIDDEN_VALUE : formatCurrency(goal.amount, goal.currency ?? settings.primaryCurrency)}
                              {goal.reachedAt && ` · Reached ${new Date(goal.reachedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              const goals = settings.goals?.map((g) =>
                                g.id === goal.id ? { ...g, hidden: false } : g
                              );
                              await db.settings.update("settings", { goals });
                            }}
                            aria-label="Restore goal"
                            title="Restore to dashboard"
                            className="rounded-lg p-2 text-zinc-400 hover:bg-[var(--dw-hover)] hover:text-emerald-500 transition-colors"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteGoalTarget(goal)}
                            aria-label="Delete goal"
                            className="rounded-lg p-2 text-zinc-400 hover:bg-[var(--dw-hover)] hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
              )}
            </>
          );
        })()}
      </CollapsibleSection>

      {/* Data */}
      <CollapsibleSection title="Data" icon={Shield}>
        <div className="mt-3 flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/60">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
          <div className="text-xs">
            <p className="text-zinc-500 dark:text-zinc-400">Your data is stored locally in this browser only.</p>
            <p className="mt-0.5 text-zinc-700 dark:text-zinc-300">Regular exports are your only backup.</p>
            <p className="mt-1">
              <span className="text-zinc-500 dark:text-zinc-400">Last export: </span>
              {(() => {
                if (!settings?.lastExportAt) return <span className="text-amber-500">Never</span>;
                const days = Math.floor((Date.now() - new Date(settings.lastExportAt).getTime()) / 86400000);
                if (days > 30) return <span className="text-amber-500">{days} days ago</span>;
                if (days === 0) return <span className="text-zinc-500 dark:text-zinc-400">Today</span>;
                return <span className="text-zinc-500 dark:text-zinc-400">{days} {days === 1 ? "day" : "days"} ago</span>;
              })()}
            </p>
          </div>
        </div>
        <Card className="mt-3 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">Export Data</p>
              <p className="text-xs text-zinc-500">
                Download all your data as a JSON backup file
              </p>
            </div>
            <Button variant="secondary" onClick={exportData}>
              <Upload className="h-4 w-4" />
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">Import Data</p>
              <p className="text-xs text-zinc-500">
                Restore from a previously exported JSON file
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Download className="h-4 w-4" />
              Import
            </Button>
          </div>

          <div className="border-t border-red-500/20 pt-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-red-400">Delete All Data</p>
                <p className="text-xs text-zinc-500">
                  Permanently remove all assets, history, and settings
                </p>
              </div>
              <Button
                variant="danger"
                className="shrink-0 whitespace-nowrap"
                onClick={() => setDeleteModalOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete All
              </Button>
            </div>
          </div>
        </Card>
      </CollapsibleSection>

      {/* About */}
      <section className="mt-8">
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          About
        </h2>
        <Card className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Version</span>
            <span className="text-sm text-zinc-900 dark:text-white">0.1.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Website</span>
            <a
              href="https://dashworth.net"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              dashworth.net
            </a>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">GitHub</span>
            <a
              href="https://github.com/vaclavik-xyz/dashworth"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              <Github className="h-3.5 w-3.5" />
              vaclavik-xyz/dashworth
            </a>
          </div>
          {activeAssets.length > 0 && categories && (() => {
            const about = calcNetWorth(activeAssets, categories, currency, rates);
            const liabilityCatIds = new Set(categories.filter((c) => c.isLiability).map((c) => c.id));
            const assetOnlyCount = activeAssets.filter((a) => !liabilityCatIds.has(a.categoryId)).length;
            const liabilityCount = activeAssets.filter((a) => liabilityCatIds.has(a.categoryId)).length;
            return (
              <p className="pt-2 text-xs text-zinc-500">
                You&apos;re tracking{" "}
                <span className="font-medium text-emerald-400">{assetOnlyCount} asset{assetOnlyCount !== 1 ? "s" : ""}</span>
                {liabilityCount > 0 && (
                  <>
                    {" "}and{" "}
                    <span className="font-medium text-red-400">{liabilityCount} {liabilityCount === 1 ? "liability" : "liabilities"}</span>
                  </>
                )}
                {" "}worth{" "}
                <span className="font-medium text-emerald-400">
                  {hidden ? HIDDEN_VALUE : formatCurrency(about.netWorth, currency)}
                </span>
                . Keep building!
              </p>
            );
          })()}
        </Card>
      </section>


      {/* Add/Edit Category modal */}
      <Modal
        open={categoryModalOpen}
        onClose={closeCategoryModal}
        title={editingCategory ? "Edit Category" : "Add Category"}
      >
        <CategoryForm category={editingCategory} onClose={closeCategoryModal} />
      </Modal>

      {/* Delete Category confirmation modal */}
      <Modal
        open={deleteCategoryTarget !== null}
        onClose={() => setDeleteCategoryTarget(null)}
        title="Delete Category"
      >
        {deleteCategoryHasAssets ? (
          <>
            <p className="text-sm text-zinc-400">
              <span className="font-medium text-zinc-900 dark:text-white">{deleteCategoryTarget?.name}</span> has{" "}
              <span className="font-medium text-zinc-900 dark:text-white">{assetCountFor(deleteCategoryTarget!.id)}</span>{" "}
              {assetCountFor(deleteCategoryTarget!.id) === 1 ? "asset" : "assets"} assigned to it.
            </p>
            <p className="mt-2 text-sm text-amber-400">
              Move or delete those assets first before removing this category.
            </p>
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={() => setDeleteCategoryTarget(null)}>
                OK
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-zinc-400">
              Are you sure you want to delete{" "}
              <span className="font-medium text-zinc-900 dark:text-white">{deleteCategoryTarget?.name}</span>?
              This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteCategoryTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDeleteCategory}>
                Delete
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Add/Edit Goal modal */}
      <Modal
        open={goalModalOpen}
        onClose={closeGoalModal}
        title={editingGoal ? "Edit Goal" : "Add Goal"}
      >
        <GoalForm goal={editingGoal} categories={categories ?? []} assets={activeAssets} onClose={closeGoalModal} />
      </Modal>

      {/* Delete Goal confirmation modal */}
      <Modal
        open={deleteGoalTarget !== null}
        onClose={() => setDeleteGoalTarget(null)}
        title="Delete Goal"
      >
        <p className="text-sm text-zinc-400">
          Are you sure you want to delete{" "}
          <span className="font-medium text-zinc-900 dark:text-white">{deleteGoalTarget?.name}</span>?
          This action cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteGoalTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeleteGoal}>
            Delete
          </Button>
        </div>
      </Modal>

      {/* Import confirmation modal */}
      <Modal
        open={importConfirmOpen}
        onClose={() => {
          setImportConfirmOpen(false);
          setPendingImport(null);
        }}
        title="Import Data"
      >
        <p className="text-sm text-zinc-400">
          This will <span className="font-medium text-red-400">replace all existing data</span> with
          the imported file. This action cannot be undone.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Tip: Export your current data first as a backup.
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setImportConfirmOpen(false);
              setPendingImport(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmImport}>
            Replace All Data
          </Button>
        </div>
      </Modal>

      {/* Import error modal */}
      <Modal
        open={importError !== null}
        onClose={() => setImportError(null)}
        title="Import Failed"
      >
        <p className="text-sm text-zinc-400">{importError}</p>
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={() => setImportError(null)}>
            OK
          </Button>
        </div>
      </Modal>

      {/* Delete all confirmation modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteConfirmText("");
        }}
        title="Delete All Data"
      >
        <p className="text-sm text-zinc-400">
          This will permanently delete all your assets, history, and settings.
          This action <span className="font-medium text-red-400">cannot be undone</span>.
        </p>
        <p className="mt-3 text-sm text-zinc-400">
          Type <span className="font-mono font-medium text-zinc-900 dark:text-white">DELETE</span> to confirm:
        </p>
        <input
          type="text"
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)}
          placeholder="DELETE"
          className="mt-2 w-full rounded-lg border border-[var(--dw-input-border)] bg-[var(--dw-input)] px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-red-500 focus:outline-none dark:text-white dark:placeholder-zinc-600"
          autoComplete="off"
        />
        <div className="mt-4 flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setDeleteModalOpen(false);
              setDeleteConfirmText("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={deleteConfirmText !== "DELETE"}
            onClick={confirmDeleteAll}
          >
            Delete Everything
          </Button>
        </div>
      </Modal>
    </div>
  );
}
