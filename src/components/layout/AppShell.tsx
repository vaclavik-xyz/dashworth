"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  const router = useRouter();
  const pathname = usePathname();
  const settings = useLiveQuery(() => db.settings.get("settings"));
  const assetCount = useLiveQuery(() => db.assets.count());

  // Start as null = "don't know yet" (matches server render)
  const [ready, setReady] = useState<boolean | null>(null);

  // After hydration + DB query, decide if user has data
  useEffect(() => {
    if (assetCount !== undefined) {
      setReady(assetCount > 0);
    }
  }, [assetCount]);

  // Redirect to landing if no data and not on home page
  useEffect(() => {
    if (ready === false && pathname !== "/") {
      router.push("/");
    }
  }, [ready, pathname, router]);

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

  // Before we know the user's state, render just children (no nav).
  // Server always renders this. Client also renders this first, then switches.
  if (ready === null) {
    return (
      <main className="min-h-screen">
        {children}
      </main>
    );
  }

  // User has data → show full app shell with nav
  if (ready) {
    return (
      <>
        <Sidebar />
        <main className="min-h-screen pb-safe md:pl-60 md:!pb-0">
          {children}
        </main>
        <BottomNav />
      </>
    );
  }

  // New user → just content, no nav (landing page / onboarding handles its own layout)
  return (
    <main className="min-h-screen">
      {children}
    </main>
  );
}
