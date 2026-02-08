"use client";

import { useState, useMemo } from "react";
import { useExampleData } from "@/contexts/ExampleDataContext";
import { formatCurrency } from "@/lib/utils";
import { convertCurrency } from "@/lib/exchange-rates";
import { getIcon } from "@/lib/icons";
import { COLOR_TEXT_CLASSES } from "@/constants/colors";
import type { Asset, Category, Currency } from "@/types";
import AssetCard from "@/components/assets/AssetCard";
import DetailPanel from "@/components/assets/detail/DetailPanel";
import type { Selection } from "@/components/assets/detail/DetailPanel";
import BottomSheet from "@/components/ui/BottomSheet";

interface GroupedSection {
  categoryId: string;
  category: Category | undefined;
  groups: { name: string | null; assets: Asset[]; subtotal: number }[];
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

    const groupNames = [...byGroup.keys()].filter((k) => k !== null).sort() as string[];
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

export default function ExampleAssetsPage() {
  const data = useExampleData();
  const [selection, setSelection] = useState<Selection>(null);
  const [mobileSelection, setMobileSelection] = useState<Selection>(null);

  if (!data) return <p className="text-zinc-500">Portfolio not found.</p>;

  const { assets, categories, snapshots, currency, rates } = data;

  const totalNetWorth = assets.reduce((s, a) => s + convertCurrency(a.currentValue, a.currency, currency, rates), 0);

  const sections = useMemo(
    () => buildGroupedSections(assets, categories, rates, currency),
    [assets, categories, rates, currency],
  );

  function toggleSelection(next: Selection) {
    setSelection((prev) => (isSelectionEqual(prev, next) ? null : next));
  }

  return (
    <>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Assets</h2>
        <p className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {formatCurrency(totalNetWorth, currency)}
        </p>
        <p className="text-sm text-zinc-500">Total net worth</p>
      </div>

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
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {section.category?.name ?? "Unknown"}
                    </h3>
                  </div>
                  <p className="mt-0.5 text-sm text-zinc-400">
                    {formatCurrency(section.subtotal, currency)}
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
                                {formatCurrency(grp.subtotal, currency)} · {grp.assets.length} assets
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
                                  primaryCurrency={currency}
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
              assets={assets}
              categories={categories}
              snapshots={snapshots}
              currency={currency}
              rates={rates}
            />
          </div>
        </div>
      </div>

      <BottomSheet
        open={mobileSelection !== null}
        onClose={() => setMobileSelection(null)}
      >
        <DetailPanel
          selection={mobileSelection}
          assets={assets}
          categories={categories}
          snapshots={snapshots}
          currency={currency}
          rates={rates}
        />
      </BottomSheet>
    </>
  );
}
