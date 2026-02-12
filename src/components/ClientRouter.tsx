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

type AppState = "loading" | "landing" | "onboarding" | "dashboard";

const LandingActionsContext = createContext<{ onStart: () => void }>({
  onStart: () => {},
});

export function useLandingActions() {
  return useContext(LandingActionsContext);
}

export default function ClientRouter({ children }: { children: ReactNode }) {
  const [appState, setAppState] = useState<AppState>("loading");

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { db } = await import("@/lib/db");
        const count = await db.assets.count();
        if (count > 0) {
          setAppState("dashboard");
          return;
        }
      } catch {}
      setAppState("landing");
    };
    checkUser();
  }, []);

  if (appState === "loading") return null;
  if (appState === "dashboard") return <DashboardView />;
  if (appState === "onboarding") {
    return (
      <OnboardingWizard
        onComplete={() => setAppState("dashboard")}
        onClose={() => setAppState("landing")}
      />
    );
  }

  return (
    <LandingActionsContext.Provider value={{ onStart: () => setAppState("onboarding") }}>
      {children}
    </LandingActionsContext.Provider>
  );
}
