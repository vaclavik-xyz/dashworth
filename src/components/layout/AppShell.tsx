"use client";

import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { db } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import { devSeedDatabase } from "@/lib/dev-seed";
import { applyTheme, watchSystemTheme } from "@/lib/theme";
import { refreshAutoPrices } from "@/lib/auto-update";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const settings = useLiveQuery(() => db.settings.get("settings"));

  useEffect(() => {
    async function init() {
      if (process.env.NODE_ENV === "development") {
        await devSeedDatabase();
      } else {
        await seedDatabase();
      }
      refreshAutoPrices();
    }
    init();
  }, []);

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
      <Sidebar />
      <main className="min-h-screen md:pl-60 pb-16 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
