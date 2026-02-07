"use client";

import { useState, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Download, Upload, Trash2, Globe, RefreshCw } from "lucide-react";
import { db } from "@/lib/db";
import { exportData } from "@/lib/export";
import { importData, validateImport, readJsonFile } from "@/lib/import";
import { seedDatabase } from "@/lib/seed";
import { useExchangeRates } from "@/lib/useExchangeRates";
import { convertCurrency } from "@/lib/exchange-rates";
import { formatDate } from "@/lib/utils";
import type { Currency, Theme, SnapshotReminder } from "@/types";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";

export default function SettingsPage() {
  const settings = useLiveQuery(() => db.settings.get("settings"));
  const { rates, refresh: refreshRates, lastUpdated } = useExchangeRates();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<unknown>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  async function updateSetting(
    key: string,
    value: string,
  ) {
    await db.settings.update("settings", { [key]: value });
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
      [db.categories, db.assets, db.snapshots, db.settings, db.exchangeRates],
      async () => {
        await db.categories.clear();
        await db.assets.clear();
        await db.snapshots.clear();
        await db.settings.clear();
        await db.exchangeRates.clear();
      },
    );
    await seedDatabase();
    setDeleteModalOpen(false);
    setDeleteConfirmText("");
  }

  const selectClass =
    "w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white";

  if (!settings) return null;

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
