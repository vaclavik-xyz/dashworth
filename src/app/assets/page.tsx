"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import type { Asset, Currency } from "@/types";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import AssetForm from "@/components/assets/AssetForm";
import AssetCard from "@/components/assets/AssetCard";

export default function AssetsPage() {
  const assets = useLiveQuery(() =>
    db.assets.filter((a) => !a.isArchived).toArray()
  );
  const categories = useLiveQuery(() => db.categories.toArray());
  const settings = useLiveQuery(() => db.settings.get("settings"));

  const [editingAsset, setEditingAsset] = useState<Asset | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);

  const primaryCurrency: Currency = settings?.primaryCurrency ?? "CZK";

  // Simple sum — all values treated as primary currency (no conversion yet)
  const totalNetWorth = assets?.reduce((sum, a) => sum + a.currentValue, 0) ?? 0;

  const categoryMap = new Map(categories?.map((c) => [c.id, c]));

  function openAdd() {
    setEditingAsset(undefined);
    setModalOpen(true);
  }

  function openEdit(asset: Asset) {
    setEditingAsset(asset);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingAsset(undefined);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await db.assets.delete(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Assets</h1>
          <p className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {formatCurrency(totalNetWorth, primaryCurrency)}
          </p>
          <p className="text-sm text-zinc-500">Total net worth</p>
        </div>
        {assets && assets.length > 0 && (
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Asset
          </Button>
        )}
      </div>

      {/* Asset list or empty state */}
      {assets && assets.length === 0 ? (
        <div className="mt-20 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
            <Wallet className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">No assets yet</h2>
          <p className="mt-1 max-w-xs text-sm text-zinc-500">
            Start tracking your net worth by adding your first asset.
          </p>
          <Button onClick={openAdd} className="mt-6">
            <Plus className="h-4 w-4" />
            Add Your First Asset
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {assets?.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              category={categoryMap.get(asset.categoryId)}
              onEdit={() => openEdit(asset)}
              onDelete={() => setDeleteTarget(asset)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingAsset ? "Edit Asset" : "Add Asset"}
      >
        <AssetForm asset={editingAsset} onClose={closeModal} />
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete Asset"
      >
        <p className="text-sm text-zinc-400">
          Are you sure you want to delete <span className="font-medium text-zinc-900 dark:text-white">{deleteTarget?.name}</span>?
          This action cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
