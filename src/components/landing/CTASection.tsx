"use client";

import { ArrowRight, Share } from "lucide-react";
import { useLandingActions } from "@/components/ClientRouter";
import { useInstall } from "./InstallProvider";
import FadeSection from "./FadeSection";

export default function CTASection() {
  const { onStart } = useLandingActions();
  const { showInstallCard, isIosSafari, deferredPrompt, handleAndroidInstall } = useInstall();

  return (
    <FadeSection className="px-6 py-16 sm:py-24 text-center">
      {showInstallCard ? (
        <div className="mx-auto w-full max-w-sm md:hidden">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] px-5 py-4">
            {isIosSafari ? (
              <p className="text-sm leading-relaxed text-zinc-300">
                <Share className="mr-1 inline h-4 w-4 -translate-y-px text-emerald-400" />
                Tap Share below →{" "}
                <span className="font-semibold text-white">
                  &quot;Add to Home Screen&quot;
                </span>
              </p>
            ) : deferredPrompt ? (
              <button
                onClick={handleAndroidInstall}
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 active:scale-[0.98]"
              >
                Install Dashworth
              </button>
            ) : null}
            <p className="mt-1.5 text-xs text-zinc-500">
              Works offline, data stays on-device
            </p>
          </div>
          <button
            onClick={onStart}
            className="mt-3 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Skip, start in browser →
          </button>
        </div>
      ) : null}
      <div className={showInstallCard ? "hidden md:block" : ""}>
        <button
          onClick={onStart}
          className="group inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/30 active:scale-[0.98]"
        >
          Start Tracking
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
        <p className="mt-3 text-xs text-zinc-500">
          No sign-up required &middot; 100% private
        </p>
      </div>
    </FadeSection>
  );
}
