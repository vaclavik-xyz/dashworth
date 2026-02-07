"use client";

import type { Asset, Category, Currency, Snapshot } from "@/types";
import Card from "@/components/ui/Card";
import DefaultOverview from "./DefaultOverview";
import CategoryDetail from "./CategoryDetail";
import GroupDetail from "./GroupDetail";
import AssetDetail from "./AssetDetail";

export type Selection =
  | { type: "category"; categoryId: string }
  | { type: "group"; categoryId: string; group: string }
  | { type: "asset"; assetId: string }
  | null;

interface DetailPanelProps {
  selection: Selection;
  assets: Asset[];
  categories: Category[];
  snapshots: Snapshot[];
  currency: Currency;
}

export default function DetailPanel({ selection, assets, categories, snapshots, currency }: DetailPanelProps) {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  function renderContent() {
    if (!selection) {
      return (
        <DefaultOverview
          assets={assets}
          categories={categories}
          snapshots={snapshots}
          currency={currency}
        />
      );
    }

    if (selection.type === "category") {
      const filtered = assets.filter((a) => a.categoryId === selection.categoryId);
      return (
        <CategoryDetail
          categoryId={selection.categoryId}
          category={categoryMap.get(selection.categoryId)}
          assets={filtered}
          snapshots={snapshots}
          currency={currency}
        />
      );
    }

    if (selection.type === "group") {
      const filtered = assets.filter(
        (a) => a.categoryId === selection.categoryId && a.group === selection.group,
      );
      return (
        <GroupDetail
          group={selection.group}
          categoryId={selection.categoryId}
          assets={filtered}
          snapshots={snapshots}
          currency={currency}
        />
      );
    }

    if (selection.type === "asset") {
      const asset = assets.find((a) => a.id === selection.assetId);
      if (!asset) return null;
      const category = categoryMap.get(asset.categoryId);
      return (
        <AssetDetail
          asset={asset}
          category={category}
          snapshots={snapshots}
          currency={currency}
        />
      );
    }

    return null;
  }

  return <Card>{renderContent()}</Card>;
}
