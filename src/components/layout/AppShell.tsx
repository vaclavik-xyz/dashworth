"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { db } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import { devSeedDatabase } from "@/lib/dev-seed";
import { applyTheme, watchSystemTheme } from "@/lib/theme";
import { refreshAutoPrices } from "@/lib/auto-update";
import { checkAutoSnapshot } from "@/lib/auto-snapshot";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const settings = useLiveQuery(() => db.settings.get("settings"));
  const assetCount = useLiveQuery(() => db.assets.count());
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    if (assetCount !== undefined) setHasData(assetCount > 0);
  }, [assetCount]);

  useEffect(() => {
    async function init() {
      // TODO: uncomment dev seed after landing page testing
      // if (process.env.NODE_ENV === "development") {
      //   await devSeedDatabase();
      // } else {
        await seedDatabase();
      // }
      await refreshAutoPrices();
      checkAutoSnapshot();
    }
    init();

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  // Re-check auto-snapshot when the setting changes (e.g. user enables it in Settings)
  useEffect(() => {
    if (settings?.autoSnapshot && settings.autoSnapshot !== "off") {
      checkAutoSnapshot();
    }
  }, [settings?.autoSnapshot]);

  // Apply theme reactively whenever settings change
  useEffect(() => {
    if (!settings) return;
    applyTheme(settings.theme);

    if (settings.theme === "system") {
      return watchSystemTheme(() => applyTheme("system"));
    }
  }, [settings?.theme]);

  return (
    <>
      {hasData && <Sidebar />}
      <main className={`min-h-screen ${hasData ? "pb-safe md:pl-60 md:!pb-0" : ""}`}>
        {children}
      </main>
      {hasData && <BottomNav />}
    </>
  );
}
