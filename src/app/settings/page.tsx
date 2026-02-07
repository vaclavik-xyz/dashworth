"use client";

import { useState, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Download, Upload, Trash2, Globe, RefreshCw, Plus, Pencil, ChevronUp, ChevronDown } from "lucide-react";
import { db } from "@/lib/db";
import { exportData } from "@/lib/export";
import { importData, validateImport, readJsonFile } from "@/lib/import";
import { seedDatabase } from "@/lib/seed";
import { useExchangeRates } from "@/lib/useExchangeRates";
import { convertCurrency } from "@/lib/exchange-rates";
import { formatDate } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import { COLOR_BADGE_CLASSES } from "@/constants/colors";
import type { AutoSnapshot, Category, Currency, Theme, SnapshotReminder } from "@/types";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import CategoryForm from "@/components/settings/CategoryForm";

export default function SettingsPage() {
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

  async function updateSetting(
    key: string,
    value: string,
  ) {
    await db.settings.update("settings", { [key]: value });
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
        setImportError("Invalid file format. Expected a dashWorth backup JSON.");
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
  }

  const selectClass =
    "w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white";

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
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 space-y-2">
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

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">Theme</p>
              <p className="text-xs text-zinc-500">Appearance preference</p>
            </div>
            <select
              value={settings.theme}
              onChange={(e) =>
                updateSetting("theme", e.target.value as Theme)
              }
              className={`${selectClass} w-28`}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
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
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
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
                      className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setDeleteCategoryTarget(cat)}
                      className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-800 dark:hover:text-red-400 transition-colors"
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
          <p className="pt-1 text-xs text-zinc-600">
            Your wealth. Your data. Your dashboard.
          </p>
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
          className="mt-2 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-red-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-600"
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
