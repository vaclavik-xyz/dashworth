"use client";

import { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";
import Button from "./Button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "dashworth-install-dismissed";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Already dismissed or already installed
    if (localStorage.getItem(DISMISSED_KEY)) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // iOS detection
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isInStandalone = "standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone;

    if (ios && !isInStandalone) {
      setIsIos(true);
      setDismissed(false);
      return;
    }

    // Android / desktop Chrome
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setDismissed(false);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, "1");
    setDeferredPrompt(null);
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      dismiss();
    }
  }

  if (dismissed) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
      <Download className="h-5 w-5 shrink-0 text-emerald-500" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-white">
          Install dashWorth
        </p>
        {isIos ? (
          <p className="text-xs text-zinc-500 flex items-center gap-1">
            Tap <Share className="inline h-3.5 w-3.5" /> then &quot;Add to Home Screen&quot;
          </p>
        ) : (
          <p className="text-xs text-zinc-500">Quick access from your home screen</p>
        )}
      </div>
      {!isIos && (
        <Button onClick={handleInstall} className="text-xs px-3 py-1.5">
          Install
        </Button>
      )}
      <button
        onClick={dismiss}
        className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
