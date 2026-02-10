"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import LandingPage from "@/components/landing/LandingPage";

const DashboardView = dynamic(() => import("@/components/dashboard/DashboardView"), { ssr: false });
const OnboardingWizard = dynamic(() => import("@/components/onboarding/OnboardingWizard"), { ssr: false });

type AppState = "landing" | "onboarding" | "dashboard";

export default function DashboardPage() {
  const [appState, setAppState] = useState<AppState>("landing");
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { db } = await import("@/lib/db");
        const count = await db.assets.count();
        if (count > 0) {
          setTransitioning(true);
          setTimeout(() => setAppState("dashboard"), 150);
        }
      } catch {
        // DB error — stay on landing
      }
    };
    checkUser();
  }, []);

  if (appState === "onboarding") {
    return <OnboardingWizard onComplete={() => setAppState("dashboard")} />;
  }

  if (appState === "dashboard") {
    return <DashboardView />;
  }

  return (
    <div className={transitioning ? "opacity-0 transition-opacity duration-150" : ""}>
      <LandingPage onStart={() => setAppState("onboarding")} />
    </div>
  );
}
