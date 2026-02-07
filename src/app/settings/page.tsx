"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { Download, Upload, Trash2, Globe, Github, RefreshCw, Plus, Pencil, ChevronUp, ChevronDown, Monitor, Palette } from "lucide-react";
import { db } from "@/lib/db";
import { exportData } from "@/lib/export";
import { importData, validateImport, readJsonFile } from "@/lib/import";
import { seedDatabase } from "@/lib/seed";
import { useExchangeRates } from "@/lib/useExchangeRates";
import { convertCurrency } from "@/lib/exchange-rates";
import { formatDate, formatCurrency, sumConverted } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import { COLOR_BADGE_CLASSES } from "@/constants/colors";
import type { AutoSnapshot, Category, Currency, CustomThemeColors, Theme, SnapshotReminder } from "@/types";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import CategoryForm from "@/components/settings/CategoryForm";

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
  const [protectedCategoryHint, setProtectedCategoryHint] = useState<string | null>(null);

  const activeAssets = assets?.filter((a) => !a.isArchived) ?? [];
  const currency: Currency = settings?.primaryCurrency ?? "USD";

  const DEFAULT_CUSTOM_THEME: CustomThemeColors = {
    base: "dark",
    bg: "#1a1a2e",
    card: "#16213e",
    border: "#0f3460",
  };

  async function updateSetting(
    key: string,
    value: string,
  ) {
    await db.settings.update("settings", { [key]: value });
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
      [db.categories, db.assets, db.snapshots, db.settings, db.exchangeRates, db.priceCache],
      async () => {
        await db.categories.clear();
        await db.assets.clear();
        await db.snapshots.clear();
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
      <section className="mt-8">
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          General
        </h2>
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

          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">Theme</p>
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

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                Snapshot Reminder
              </p>
              <p className="text-xs text-zinc-500">
                How often to remind you to take a snapshot
              </p>
            </div>
            <select
              value={settings.snapshotReminder}
              onChange={(e) =>
                updateSetting(
                  "snapshotReminder",
                  e.target.value as SnapshotReminder,
                )
              }
              className={`${selectClass} w-28`}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="none">None</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                Auto-Snapshot
              </p>
              <p className="text-xs text-zinc-500">
                Automatically take snapshots on a schedule
              </p>
            </div>
            <select
              value={settings.autoSnapshot}
              onChange={(e) =>
                updateSetting(
                  "autoSnapshot",
                  e.target.value as AutoSnapshot,
                )
              }
              className={`${selectClass} w-28`}
            >
              <option value="off">Off</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </Card>
      </section>

      {/* Categories */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Categories
          </h2>
          <Button variant="ghost" onClick={openAddCategory} className="text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add Category
          </Button>
        </div>
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
                      <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                        {cat.name}
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
                        className="rounded p-0.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-colors"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => swapSortOrder(cat, "down")}
                        disabled={idx === (categories?.length ?? 0) - 1}
                        className="rounded p-0.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-colors"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => openEditCategory(cat)}
                      className="rounded-lg p-2 text-zinc-400 hover:bg-[var(--dw-hover)] hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    {/* Delete */}
                    {["crypto", "stocks"].includes(cat.name.toLowerCase()) ? (
                      <button
                        type="button"
                        onClick={() => {
                          setProtectedCategoryHint(cat.name);
                          setTimeout(() => setProtectedCategoryHint(null), 3000);
                        }}
                        className="relative rounded-lg p-2 text-zinc-600 cursor-not-allowed transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="block h-[1.5px] w-5 rotate-45 rounded bg-zinc-600" />
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteCategoryTarget(cat)}
                        className="rounded-lg p-2 text-zinc-400 hover:bg-[var(--dw-hover)] hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
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
        {protectedCategoryHint && (
          <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2.5 shadow-lg">
            <p className="whitespace-nowrap text-xs text-zinc-300">
              {protectedCategoryHint} can&apos;t be deleted — needed for auto price tracking.
            </p>
          </div>
        )}
      </section>

      {/* Data */}
      <section className="mt-8">
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          Data
        </h2>
        <Card className="mt-3 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">Export Data</p>
              <p className="text-xs text-zinc-500">
                Download all your data as a JSON backup file
              </p>
            </div>
            <Button variant="secondary" onClick={exportData}>
              <Download className="h-4 w-4" />
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
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </div>
        </Card>
      </section>

      {/* Danger Zone */}
      <section className="mt-8">
        <h2 className="text-sm font-medium text-red-400 uppercase tracking-wider">
          Danger Zone
        </h2>
        <Card className="mt-3 border-red-500/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">Delete All Data</p>
              <p className="text-xs text-zinc-500">
                Permanently remove all assets, snapshots, and settings
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
        </Card>
      </section>

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
          {activeAssets.length > 0 && (
            <p className="pt-2 text-xs text-zinc-500">
              You&apos;re tracking{" "}
              <span className="font-medium text-emerald-400">{activeAssets.length} asset{activeAssets.length !== 1 ? "s" : ""}</span>
              {" "}worth{" "}
              <span className="font-medium text-emerald-400">
                {formatCurrency(sumConverted(activeAssets, currency, rates), currency)}
              </span>
              . Keep building!
            </p>
          )}
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
          This will permanently delete all your assets, snapshots, and settings.
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
