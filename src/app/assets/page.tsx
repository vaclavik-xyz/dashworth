"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Wallet, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { formatCurrency, calcNetWorth, HIDDEN_VALUE } from "@/lib/utils";
import { convertCurrency } from "@/lib/exchange-rates";
import { useExchangeRates } from "@/lib/useExchangeRates";
import { getIcon } from "@/lib/icons";
import { COLOR_TEXT_CLASSES } from "@/constants/colors";
import type { Asset, AssetChangeEntry, Category, Currency } from "@/types";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import QuickUpdateModal from "@/components/assets/QuickUpdateModal";
import AddAssetPanel from "@/components/assets/AddAssetPanel";
import AssetCard from "@/components/assets/AssetCard";
import CategoryForm from "@/components/settings/CategoryForm";
import DetailPanel from "@/components/assets/detail/DetailPanel";
import type { Selection } from "@/components/assets/detail/DetailPanel";
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

  // Include ALL categories (even empty ones) + orphan categoryIds
  const seen = new Set<string>();
  const allCatIds: string[] = [];
  for (const cat of categories) {
    seen.add(cat.id);
    allCatIds.push(cat.id);
  }
  for (const catId of byCat.keys()) {
    if (!seen.has(catId)) allCatIds.push(catId);
  }

  const sections = allCatIds.map((catId) => {
    const catAssets = byCat.get(catId) ?? [];
    const category = categoryMap.get(catId);

    // Sort assets by converted value descending
    const sorted = [...catAssets].sort((a, b) => {
      const va = convertCurrency(a.currentValue, a.currency, targetCurrency, rates);
      const vb = convertCurrency(b.currentValue, b.currency, targetCurrency, rates);
      return vb - va;
    });

    const byGroup = new Map<string | null, Asset[]>();
    for (const a of sorted) {
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

  // Sort: assets first, then liabilities; within each group: non-empty by value desc, empty at bottom by sortOrder
  sections.sort((a, b) => {
    const aLiab = a.category?.isLiability ? 1 : 0;
    const bLiab = b.category?.isLiability ? 1 : 0;
    if (aLiab !== bLiab) return aLiab - bLiab;

    if (a.assetCount > 0 && b.assetCount === 0) return -1;
    if (a.assetCount === 0 && b.assetCount > 0) return 1;
    if (a.assetCount > 0 && b.assetCount > 0) return b.subtotal - a.subtotal;
    return (a.category?.sortOrder ?? 99) - (b.category?.sortOrder ?? 99);
  });

  return sections;
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
  const assetChanges = useLiveQuery(() => db.assetChanges.orderBy("createdAt").reverse().toArray());

  const { hidden, toggle } = usePrivacy();

  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [addPanelCategoryId, setAddPanelCategoryId] = useState<string | undefined>();
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [mobileSelection, setMobileSelection] = useState<Selection>(null);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);
  const [sheetAssetId, setSheetAssetId] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const scrollYRef = useRef(0);

  const { rates } = useExchangeRates();
  const primaryCurrency: Currency = settings?.primaryCurrency ?? "CZK";
  const breakdown = assets && categories ? calcNetWorth(assets, categories, primaryCurrency, rates) : { totalAssets: 0, totalLiabilities: 0, netWorth: 0 };
  const totalNetWorth = breakdown.netWorth;

  const sections = useMemo(
    () => (assets && categories ? buildGroupedSections(assets, categories, rates, primaryCurrency) : []),
    [assets, categories, rates, primaryCurrency],
  );

  // Latest change per asset (for percentage display on cards)
  const latestChangeMap = useMemo(() => {
    const map = new Map<string, AssetChangeEntry>();
    if (!assetChanges) return map;
    for (const change of assetChanges) {
      if (!map.has(change.assetId)) {
        map.set(change.assetId, change);
      }
    }
    return map;
  }, [assetChanges]);

  function openAdd(categoryId?: string) {
    setAddPanelCategoryId(categoryId);
    setAddPanelOpen(true);
  }

  function closeAddPanel() {
    setAddPanelOpen(false);
    setAddPanelCategoryId(undefined);
  }

  function toggleCategoryCollapse(categoryId: string) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }

  function toggleGroupCollapse(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await db.assets.delete(deleteTarget.id);
    setDeleteTarget(null);
    // Clear selection if the deleted asset was selected
    if (selection?.type === "asset" && selection.assetId === deleteTarget.id) {
      setSelection(null);
    }
    if (mobileSelection?.type === "asset" && mobileSelection.assetId === deleteTarget.id) {
      setMobileSelection(null);
      setMobileView("list");
    }
    setEditingAssetId(null);
  }

  function toggleSelection(next: Selection) {
    setSelection((prev) => {
      const newSel = isSelectionEqual(prev, next) ? null : next;
      // Clear editing when selection changes
      if (editingAssetId && (!newSel || newSel.type !== "asset" || newSel.assetId !== editingAssetId)) {
        setEditingAssetId(null);
      }
      return newSel;
    });
  }

  function navigateToMobileDetail(sel: Selection) {
    scrollYRef.current = window.scrollY;
    setMobileSelection(sel);
    setMobileView("detail");
    window.scrollTo(0, 0);
  }

  function closeMobileDetail() {
    setMobileView("list");
    setMobileSelection(null);
    setEditingAssetId(null);
    requestAnimationFrame(() => window.scrollTo(0, scrollYRef.current));
  }

  function handleMobileBack() {
    if (editingAssetId) {
      setEditingAssetId(null);
    } else {
      closeMobileDetail();
    }
  }

  return (
    <div className="p-6 md:p-10">
      {/* Mobile full-screen detail view */}
      {mobileView === "detail" && mobileSelection && (
        <div className="md:hidden">
          <button
            type="button"
            onClick={handleMobileBack}
            className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {editingAssetId ? "Cancel" : "Assets"}
          </button>
          <DetailPanel
            selection={mobileSelection}
            assets={assets ?? []}
            categories={categories ?? []}
            history={history ?? []}
            assetChanges={assetChanges ?? []}
            currency={primaryCurrency}
            rates={rates}
            editingAssetId={editingAssetId}
            onEditAsset={(id) => setEditingAssetId(id)}
            onEditEnd={() => setEditingAssetId(null)}
            onDeleteAsset={(asset) => setDeleteTarget(asset)}
          />
        </div>
      )}

      {/* Main content — hidden on mobile when detail view is active */}
      <div className={mobileView === "detail" ? "hidden md:block" : ""}>
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
          {breakdown.totalLiabilities > 0 && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-emerald-400">
                {hidden ? HIDDEN_VALUE : formatCurrency(breakdown.totalAssets, primaryCurrency)}
                <span className="ml-1 text-zinc-500">assets</span>
              </span>
              <span className="text-red-400">
                {hidden ? HIDDEN_VALUE : `−${formatCurrency(breakdown.totalLiabilities, primaryCurrency)}`}
                <span className="ml-1 text-zinc-500">debt</span>
              </span>
            </div>
          )}
        </div>
        {assets && assets.length > 0 && (
          <Button onClick={() => openAdd()}>
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
          <Button onClick={() => openAdd()} className="mt-6">
            <Plus className="h-4 w-4" />
            Add Your First Asset
          </Button>
        </div>
      ) : (
        <div className="mt-6 flex gap-0 md:gap-6">
          {/* Left: asset list */}
          <div className="w-full md:w-3/5 space-y-8">
            {sections.map((section, sectionIdx) => {
              const Icon = section.category ? getIcon(section.category.icon) : null;
              const colorClass = section.category
                ? (COLOR_TEXT_CLASSES[section.category.color] ?? "text-zinc-500")
                : "text-zinc-500";
              const isLiabilityCategory = section.category?.isLiability ?? false;

              const isCategorySelected =
                selection?.type === "category" && selection.categoryId === section.categoryId;

              const catSelection: Selection = { type: "category", categoryId: section.categoryId };
              const isCatCollapsed = collapsedCategories.has(section.categoryId);

              // Show divider before first liability category
              const prevSection = sectionIdx > 0 ? sections[sectionIdx - 1] : null;
              const showLiabilityDivider = isLiabilityCategory && prevSection && !prevSection.category?.isLiability;

              return (
                <div key={section.categoryId}>
                  {showLiabilityDivider && (
                    <div className="flex items-center gap-3 mb-4 -mt-2">
                      <div className="h-px flex-1 bg-red-500/20" />
                      <span className="text-xs font-medium text-red-400">Liabilities</span>
                      <div className="h-px flex-1 bg-red-500/20" />
                    </div>
                  )}
                  {/* Category header */}
                  <div
                    className={`mb-3 cursor-pointer rounded-lg transition-colors ${
                      isCategorySelected
                        ? isLiabilityCategory
                          ? "md:border-l-2 md:border-red-500 md:bg-red-500/5 md:pl-2"
                          : "md:border-l-2 md:border-emerald-500 md:bg-emerald-500/5 md:pl-2"
                        : "md:border-l-2 md:border-transparent md:pl-2"
                    }`}
                    onClick={() => {
                      toggleCategoryCollapse(section.categoryId);
                      if (window.matchMedia("(min-width: 768px)").matches) {
                        toggleSelection(catSelection);
                      }
                    }}
                  >
                    <div className={`flex items-center gap-2 ${isCatCollapsed ? "md:py-1" : ""}`}>
                      {Icon && <Icon className={`h-5 w-5 ${isCatCollapsed ? "md:h-6 md:w-6" : ""} ${colorClass}`} />}
                      <h2 className={`text-lg font-semibold text-zinc-900 dark:text-white ${isCatCollapsed ? "md:text-xl" : ""}`}>
                        {section.category?.name ?? "Unknown"}
                      </h2>
                      {isLiabilityCategory && (
                        <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-400">debt</span>
                      )}
                      {isCatCollapsed && (
                        <>
                          <span className="ml-auto text-sm md:text-base text-zinc-400">
                            {hidden ? HIDDEN_VALUE : formatCurrency(section.subtotal, primaryCurrency)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToMobileDetail(catSelection);
                            }}
                            className="inline-flex items-center justify-center min-w-[24px] h-6 md:h-7 px-2 md:px-2.5 rounded-full bg-zinc-700 text-zinc-300 text-xs md:text-sm font-medium md:pointer-events-none"
                          >
                            {section.assetCount}
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAdd(section.categoryId);
                        }}
                        className={`${isCatCollapsed ? "" : "ml-auto "}rounded-md p-1 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors`}
                        aria-label={`Add asset to ${section.category?.name ?? "category"}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    {!isCatCollapsed && (
                      <p className={`mt-0.5 text-sm ${isLiabilityCategory ? "text-red-400" : "text-zinc-400"}`}>
                        {hidden ? HIDDEN_VALUE : (isLiabilityCategory ? `−${formatCurrency(section.subtotal, primaryCurrency)}` : formatCurrency(section.subtotal, primaryCurrency))}
                        <span className="text-zinc-500"> · {section.assetCount} {section.assetCount === 1 ? "asset" : "assets"}</span>
                      </p>
                    )}
                  </div>

                  {!isCatCollapsed && (section.assetCount === 0 ? (
                    <p className="ml-1 text-sm text-zinc-500">No assets yet. Tap + to add one.</p>
                  ) : (
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
                        const groupKey = grp.name ? `${section.categoryId}::${grp.name}` : null;
                        const isGrpCollapsed = groupKey ? collapsedGroups.has(groupKey) : false;

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
                                  if (groupKey) toggleGroupCollapse(groupKey);
                                  if (grpSelection && window.matchMedia("(min-width: 768px)").matches) {
                                    toggleSelection(grpSelection);
                                  }
                                }}
                              >
                                <div className={`flex items-center gap-1.5 ${isGrpCollapsed ? "md:py-0.5" : ""}`}>
                                  <span className={`text-sm font-medium text-zinc-600 dark:text-zinc-400 ${isGrpCollapsed ? "md:text-base" : ""}`}>
                                    {grp.name}
                                  </span>
                                  {isGrpCollapsed && (
                                    <>
                                      <span className="ml-auto text-xs md:text-sm text-zinc-500">
                                        {hidden ? HIDDEN_VALUE : formatCurrency(grp.subtotal, primaryCurrency)}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (grpSelection) navigateToMobileDetail(grpSelection);
                                        }}
                                        className="inline-flex items-center justify-center min-w-[24px] h-6 md:h-7 px-2 md:px-2.5 rounded-full bg-zinc-700 text-zinc-300 text-xs md:text-sm font-medium md:pointer-events-none"
                                      >
                                        {grp.assets.length}
                                      </button>
                                    </>
                                  )}
                                </div>
                                {!isGrpCollapsed && (
                                  <p className="text-xs text-zinc-500">
                                    {hidden ? HIDDEN_VALUE : formatCurrency(grp.subtotal, primaryCurrency)} · {grp.assets.length} {grp.assets.length === 1 ? "asset" : "assets"}
                                  </p>
                                )}
                              </div>
                            )}
                            {!isGrpCollapsed && (<div className={`grid ${"gap-1.5"}`}>
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
                                  >
                                    <AssetCard
                                      asset={asset}
                                      category={section.category}
                                      latestChange={latestChangeMap.get(asset.id)}
                                      isExpanded={expandedAssetId === asset.id}
                                      onToggleExpand={() => {
                                        if (window.matchMedia("(max-width: 767px)").matches) {
                                          setSheetAssetId(asset.id);
                                        } else {
                                          setExpandedAssetId((prev) => prev === asset.id ? null : asset.id);
                                          toggleSelection(assetSelection);
                                        }
                                      }}
                                      onViewDetails={() => {
                                        setExpandedAssetId(null);
                                        setEditingAssetId(null);
                                        setSelection(assetSelection);
                                        navigateToMobileDetail(assetSelection);
                                      }}
                                      onSettings={() => {
                                        setExpandedAssetId(null);
                                        setEditingAssetId(asset.id);
                                        setSelection(assetSelection);
                                        navigateToMobileDetail(assetSelection);
                                      }}
                                      currency={primaryCurrency}
                                      rates={rates}
                                    />
                                  </div>
                                );
                              })}
                            </div>)}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Add Category */}
            <div className="border-t border-[var(--dw-border)] pt-4">
              <button
                type="button"
                onClick={() => setCategoryModalOpen(true)}
                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-emerald-500 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Category
              </button>
            </div>
          </div>

          {/* Right: detail panel (desktop only) */}
          <div className="hidden md:block w-2/5 pl-0">
            <div className="sticky top-6">
              <DetailPanel
                selection={selection}
                assets={assets ?? []}
                categories={categories ?? []}
                history={history ?? []}
                assetChanges={assetChanges ?? []}
                currency={primaryCurrency}
                rates={rates}
                editingAssetId={editingAssetId}
                onEditAsset={(id) => setEditingAssetId(id)}
                onEditEnd={() => setEditingAssetId(null)}
                onDeleteAsset={(asset) => setDeleteTarget(asset)}
              />
            </div>
          </div>
        </div>
      )}
      </div>{/* end main content wrapper */}

      {/* Add asset panel */}
      <AddAssetPanel
        open={addPanelOpen}
        onClose={closeAddPanel}
        defaultCategoryId={addPanelCategoryId}
      />

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

      {/* Add Category modal */}
      <Modal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title="Add Category"
      >
        <CategoryForm onClose={() => setCategoryModalOpen(false)} />
      </Modal>

      {/* Mobile quick update modal */}
      <QuickUpdateModal
        asset={sheetAssetId ? (assets ?? []).find((a) => a.id === sheetAssetId) ?? null : null}
        category={sheetAssetId ? (categories ?? []).find((c) => c.id === (assets ?? []).find((a) => a.id === sheetAssetId)?.categoryId) : undefined}
        currency={primaryCurrency}
        rates={rates}
        onClose={() => setSheetAssetId(null)}
        onViewDetails={(assetId) => {
          setSheetAssetId(null);
          const sel: Selection = { type: "asset", assetId };
          setSelection(sel);
          navigateToMobileDetail(sel);
        }}
        onSettings={(assetId) => {
          setSheetAssetId(null);
          setEditingAssetId(assetId);
          const sel: Selection = { type: "asset", assetId };
          setSelection(sel);
          navigateToMobileDetail(sel);
        }}
      />
    </div>
  );
}

