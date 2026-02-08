"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { db } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import { applyTheme, watchSystemTheme } from "@/lib/theme";
import { refreshAutoPrices } from "@/lib/auto-update";
import { useAutoHistory } from "@/hooks/useAutoHistory";
import { PrivacyProvider } from "@/contexts/PrivacyContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const settings = useLiveQuery(() => db.settings.get("settings"));
  const assetCount = useLiveQuery(() => db.assets.count());

  // Ensure first client render matches server (no nav).
  const [mounted, setMounted] = useState(false);

  // Start as null = "don't know yet" (matches server render)
  const [ready, setReady] = useState<boolean | null>(null);

  // Auto-record history when portfolio value changes
  useAutoHistory();

  useEffect(() => {
    setMounted(true);
  }, []);

  // After hydration + DB query, decide if user has data
  useEffect(() => {
    if (mounted && assetCount !== undefined) {
      setReady(assetCount > 0);
    }
  }, [mounted, assetCount]);

  // Redirect to landing if no data and not on home page
  useEffect(() => {
    if (ready === false && pathname !== "/") {
      router.push("/");
    }
  }, [ready, pathname, router]);

  useEffect(() => {
    async function init() {
      await seedDatabase();
      await refreshAutoPrices();
    }
    init();

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  // Apply theme reactively whenever settings change
  useEffect(() => {
    if (!settings) return;
    applyTheme(settings.theme, settings.customTheme);

    if (settings.theme === "system") {
      return watchSystemTheme(() => applyTheme("system"));
    }
  }, [settings?.theme, settings?.customTheme]);

  // Before we know the user's state, render just children (no nav).
  // Server always renders this. Client renders this on first pass too (mounted=false).
  if (!mounted || ready === null) {
    return (
      <PrivacyProvider>
        <main className="min-h-screen">
          {children}
        </main>
      </PrivacyProvider>
    );
  }

  // User has data → show full app shell with nav
  if (ready) {
    return (
      <PrivacyProvider>
        <Sidebar />
        <main className="min-h-screen pb-safe md:pl-60 md:!pb-0">
          {children}
        </main>
        <BottomNav />
      </PrivacyProvider>
    );
  }

  // New user → just content, no nav (landing page / onboarding handles its own layout)
  return (
    <PrivacyProvider>
      <main className="min-h-screen">
        {children}
      </main>
    </PrivacyProvider>
  );
}
