"use client";

import { useEffect } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { seedDatabase } from "@/lib/seed";

export default function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    seedDatabase();
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
