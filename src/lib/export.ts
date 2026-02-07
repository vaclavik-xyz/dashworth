import { db } from "./db";

interface ExportData {
  app: "dashworth";
  version: 1;
  exportedAt: string;
  data: {
    categories: unknown[];
    assets: unknown[];
    snapshots: unknown[];
    settings: unknown;
  };
}

export async function exportData(): Promise<void> {
  const [categories, assets, snapshots, settings] = await Promise.all([
    db.categories.toArray(),
    db.assets.toArray(),
    db.snapshots.toArray(),
    db.settings.get("settings"),
  ]);

  const payload: ExportData = {
    app: "dashworth",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      categories,
      assets,
      snapshots,
      settings: settings ?? {},
    },
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `dashworth-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
