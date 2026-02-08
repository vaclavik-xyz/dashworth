"use client";

import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Wallet, Eye, EyeOff } from "lucide-react";
import { db } from "@/lib/db";
import { formatCurrency, sumConverted, HIDDEN_VALUE } from "@/lib/utils";
import { convertCurrency } from "@/lib/exchange-rates";
import { useExchangeRates } from "@/lib/useExchangeRates";
import { getIcon } from "@/lib/icons";
import { COLOR_TEXT_CLASSES } from "@/constants/colors";
import type { Asset, Category, Currency } from "@/types";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import AssetForm from "@/components/assets/AssetForm";
import AssetCard from "@/components/assets/AssetCard";
import DetailPanel from "@/components/assets/detail/DetailPanel";
import type { Selection } from "@/components/assets/detail/DetailPanel";
import BottomSheet from "@/components/ui/BottomSheet";
import { usePrivacy } from "@/contexts/PrivacyContext";

interface GroupedSection {
  categoryId: string;
  category: Category | undefined;
  groups: {
    name: string | null; // null = ungrouped
    assets: Asset[];
    subtotal: number;
  }[];
  subtotal: number;
  assetCount: number;
}

function buildGroupedSections(
  assets: Asset[],
  categories: Category[],
  rates: Record<string, number>,
  targetCurrency: Currency,
): GroupedSection[] {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const byCat = new Map<string, Asset[]>();

  for (const asset of assets) {
    const list = byCat.get(asset.categoryId) ?? [];
    list.push(asset);
    byCat.set(asset.categoryId, list);
  }

  // Sort categories by sortOrder
  const sortedCatIds = [...byCat.keys()].sort((a, b) => {
    const ca = categoryMap.get(a);
    const cb = categoryMap.get(b);
    return (ca?.sortOrder ?? 99) - (cb?.sortOrder ?? 99);
  });

  return sortedCatIds.map((catId) => {
    const catAssets = byCat.get(catId)!;
    const category = categoryMap.get(catId);

    const byGroup = new Map<string | null, Asset[]>();
    for (const a of catAssets) {
      const key = a.group ?? null;
      const list = byGroup.get(key) ?? [];
      list.push(a);
      byGroup.set(key, list);
    }

    // Named groups first (sorted), ungrouped last
    const groupNames = [...byGroup.keys()]
      .filter((k) => k !== null)
      .sort() as string[];
    const hasUngrouped = byGroup.has(null);

    const groups = [
      ...groupNames.map((name) => {
        const ga = byGroup.get(name)!;
        return { name, assets: ga, subtotal: ga.reduce((s, a) => s + convertCurrency(a.currentValue, a.currency, targetCurrency, rates), 0) };
      }),
      ...(hasUngrouped
        ? byGroup.get(null)!.map((a) => ({
            name: null as string | null,
            assets: [a],
            subtotal: convertCurrency(a.currentValue, a.currency, targetCurrency, rates),
          }))
        : []),
    ];

    return {
      categoryId: catId,
      category,
      groups,
      subtotal: catAssets.reduce((s, a) => s + convertCurrency(a.currentValue, a.currency, targetCurrency, rates), 0),
      assetCount: catAssets.length,
    };
  });
}

function isSelectionEqual(a: Selection, b: Selection): boolean {
  if (a === null || b === null) return a === b;
  if (a.type !== b.type) return false;
  if (a.type === "category" && b.type === "category") return a.categoryId === b.categoryId;
  if (a.type === "group" && b.type === "group") return a.categoryId === b.categoryId && a.group === b.group;
  if (a.type === "asset" && b.type === "asset") return a.assetId === b.assetId;
  return false;
}

export default function AssetsPage() {
  const assets = useLiveQuery(() =>
    db.assets.filter((a) => !a.isArchived).toArray()
  );
  const categories = useLiveQuery(() => db.categories.toArray());
  const settings = useLiveQuery(() => db.settings.get("settings"));
  const history = useLiveQuery(() => db.history.orderBy("createdAt").toArray());

  const { hidden, toggle } = usePrivacy();

  const [editingAsset, setEditingAsset] = useState<Asset | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [mobileSelection, setMobileSelection] = useState<Selection>(null);

  const { rates } = useExchangeRates();
  const primaryCurrency: Currency = settings?.primaryCurrency ?? "CZK";
  const totalNetWorth = assets ? sumConverted(assets, primaryCurrency, rates) : 0;

  const sections = useMemo(
    () => (assets && categories ? buildGroupedSections(assets, categories, rates, primaryCurrency) : []),
    [assets, categories, rates, primaryCurrency],
  );

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

  function toggleSelection(next: Selection) {
    setSelection((prev) => (isSelectionEqual(prev, next) ? null : next));
  }

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Assets</h1>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {hidden ? HIDDEN_VALUE : formatCurrency(totalNetWorth, primaryCurrency)}
            </p>
            <button
              type="button"
              onClick={toggle}
              className="rounded-md p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label={hidden ? "Show values" : "Hide values"}
            >
              {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
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
        <div className="mt-6 flex gap-0 md:gap-6">
          {/* Left: asset list */}
          <div className="w-full md:w-3/5 space-y-8">
            {sections.map((section) => {
              const Icon = section.category ? getIcon(section.category.icon) : null;
              const colorClass = section.category
                ? (COLOR_TEXT_CLASSES[section.category.color] ?? "text-zinc-500")
                : "text-zinc-500";

              const isCategorySelected =
                selection?.type === "category" && selection.categoryId === section.categoryId;

              const catSelection: Selection = { type: "category", categoryId: section.categoryId };

              return (
                <div key={section.categoryId}>
                  {/* Category header */}
                  <div
                    className={`mb-3 cursor-pointer rounded-lg transition-colors ${
                      isCategorySelected
                        ? "md:border-l-2 md:border-emerald-500 md:bg-emerald-500/5 md:pl-2"
                        : "md:border-l-2 md:border-transparent md:pl-2"
                    }`}
                    onClick={() => {
                      toggleSelection(catSelection);
                      setMobileSelection(catSelection);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className={`h-5 w-5 ${colorClass}`} />}
                      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                        {section.category?.name ?? "Unknown"}
                      </h2>
                    </div>
                    <p className="mt-0.5 text-sm text-zinc-400">
                      {hidden ? HIDDEN_VALUE : formatCurrency(section.subtotal, primaryCurrency)}
                      <span className="text-zinc-500"> · {section.assetCount} {section.assetCount === 1 ? "asset" : "assets"}</span>
                    </p>
                  </div>

                  <div className="space-y-4">
                    {section.groups.map((grp, gi) => {
                      const isGroupSelected =
                        grp.name !== null &&
                        selection?.type === "group" &&
                        selection.categoryId === section.categoryId &&
                        selection.group === grp.name;

                      const grpSelection: Selection = grp.name
                        ? { type: "group", categoryId: section.categoryId, group: grp.name }
                        : null;

                      return (
                        <div key={grp.name ?? `ungrouped-${gi}`}>
                          {/* Group header */}
                          {grp.name && grp.assets.length > 0 && (
                            <div
                              className={`mb-2 ml-1 cursor-pointer rounded-lg transition-colors ${
                                isGroupSelected
                                  ? "md:border-l-2 md:border-emerald-500 md:bg-emerald-500/5 md:pl-2"
                                  : "md:border-l-2 md:border-transparent md:pl-2"
                              }`}
                              onClick={() => {
                                if (grpSelection) {
                                  toggleSelection(grpSelection);
                                  setMobileSelection(grpSelection);
                                }
                              }}
                            >
                              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                {grp.name}
                              </span>
                              {grp.assets.length > 1 && (
                                <p className="text-xs text-zinc-500">
                                  {hidden ? HIDDEN_VALUE : formatCurrency(grp.subtotal, primaryCurrency)} · {grp.assets.length} assets
                                </p>
                              )}
                            </div>
                          )}
                          <div className="grid gap-3">
                            {grp.assets.map((asset) => {
                              const isAssetSelected =
                                selection?.type === "asset" && selection.assetId === asset.id;
                              const assetSelection: Selection = { type: "asset", assetId: asset.id };

                              return (
                                <div
                                  key={asset.id}
                                  className={`rounded-lg transition-colors ${
                                    isAssetSelected
                                      ? "md:border-l-2 md:border-emerald-500 md:bg-emerald-500/5 md:pl-1"
                                      : "md:border-l-2 md:border-transparent md:pl-1"
                                  }`}
                                  onClick={() => {
                                    toggleSelection(assetSelection);
                                    setMobileSelection(assetSelection);
                                  }}
                                >
                                  <AssetCard
                                    asset={asset}
                                    category={section.category}
                                    onEdit={() => openEdit(asset)}
                                    onDelete={() => setDeleteTarget(asset)}
                                    primaryCurrency={primaryCurrency}
                                    rates={rates}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: detail panel (desktop only) */}
          <div className="hidden md:block w-2/5 pl-0">
            <div className="sticky top-6">
              <DetailPanel
                selection={selection}
                assets={assets ?? []}
                categories={categories ?? []}
                history={history ?? []}
                currency={primaryCurrency}
                rates={rates}
              />
            </div>
          </div>
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

      {/* Mobile bottom sheet for detail */}
      <BottomSheet
        open={mobileSelection !== null}
        onClose={() => setMobileSelection(null)}
      >
        <DetailPanel
          selection={mobileSelection}
          assets={assets ?? []}
          categories={categories ?? []}
          history={history ?? []}
          currency={primaryCurrency}
          rates={rates}
        />
      </BottomSheet>
    </div>
  );
}
