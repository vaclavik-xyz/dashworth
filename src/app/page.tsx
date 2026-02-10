"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import dynamic from "next/dynamic";
import LandingPage from "@/components/landing/LandingPage";

const OnboardingWizard = dynamic(() => import("@/components/onboarding/OnboardingWizard"), { ssr: false });
const DashboardView = dynamic(() => import("@/components/dashboard/DashboardView"), { ssr: false });

type View = "landing" | "onboarding" | "dashboard";

export default function DashboardPage() {
  const [view, setView] = useState<View>("landing");
  const assetCount = useLiveQuery(() => db.assets.count());

  // Still loading from IndexedDB — blank dark screen for seamless transition
  if (assetCount === undefined) {
    return <div className="fixed inset-0 z-50 bg-[#09090b]" />;
  }

  // New user flow
  if (assetCount === 0) {
    if (view === "onboarding") {
      return <OnboardingWizard onComplete={() => setView("dashboard")} />;
    }
    return <LandingPage onStart={() => setView("onboarding")} />;
  }

  return <DashboardView />;
}
