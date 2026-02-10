"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import dynamic from "next/dynamic";

const DashboardView = dynamic(
  () => import("@/components/dashboard/DashboardView"),
  { ssr: false },
);
const OnboardingWizard = dynamic(
  () => import("@/components/onboarding/OnboardingWizard"),
  { ssr: false },
);

type AppState = "landing" | "onboarding" | "dashboard";

const LandingActionsContext = createContext<{ onStart: () => void }>({
  onStart: () => {},
});

export function useLandingActions() {
  return useContext(LandingActionsContext);
}

export default function ClientRouter({ children }: { children: ReactNode }) {
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

  if (appState === "dashboard") return <DashboardView />;
  if (appState === "onboarding") {
    return <OnboardingWizard onComplete={() => setAppState("dashboard")} />;
  }

  return (
    <LandingActionsContext.Provider value={{ onStart: () => setAppState("onboarding") }}>
      <div className={transitioning ? "opacity-0 transition-opacity duration-150" : ""}>
        {children}
      </div>
    </LandingActionsContext.Provider>
  );
}
