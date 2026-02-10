"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface InstallState {
  showInstallCard: boolean;
  isIosSafari: boolean;
  deferredPrompt: Event | null;
  handleAndroidInstall: () => Promise<void>;
}

const InstallContext = createContext<InstallState>({
  showInstallCard: false,
  isIosSafari: false,
  deferredPrompt: null,
  handleAndroidInstall: async () => {},
});

export function useInstall() {
  return useContext(InstallContext);
}

export default function InstallProvider({ children }: { children: ReactNode }) {
  const [isStandalone, setIsStandalone] = useState(true);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
    const ua = navigator.userAgent;
    const isIos =
      /iPhone|iPad/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIosSafari(isIos && !standalone);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const showInstallCard = !isStandalone && (isIosSafari || !!deferredPrompt);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    (deferredPrompt as any).prompt();
    const { outcome } = await (deferredPrompt as any).userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  return (
    <InstallContext.Provider value={{ showInstallCard, isIosSafari, deferredPrompt, handleAndroidInstall }}>
      {children}
    </InstallContext.Provider>
  );
}
