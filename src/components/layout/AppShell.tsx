"use client";

import { useEffect } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { seedDatabase } from "@/lib/seed";
import { devSeedDatabase } from "@/lib/dev-seed";

export default function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      devSeedDatabase();
    } else {
      seedDatabase();
    }
  }, []);

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
