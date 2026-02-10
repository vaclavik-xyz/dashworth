import {
  Shield,
  RefreshCw,
  Layers,
  History,
  Eye,
  FolderOpen,
  Download,
  Wifi,
  Palette,
  Sparkles,
  Github,
} from "lucide-react";
import InstallProvider from "./InstallProvider";
import HeroSection from "./HeroSection";
import FadeSection from "./FadeSection";
import FAQSection from "./FAQSection";
import CTASection from "./CTASection";

export default function LandingPage() {
  return (
    <InstallProvider>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-[#09090b]">
        {/* ── Hero ── */}
        <HeroSection />

        {/* ── Features ── */}
        <FadeSection className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
          <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
            Features
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-zinc-300">
            Everything you need to track and understand your wealth.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 md:p-5">
              <Shield className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
              <h3 className="mt-2 text-sm font-semibold text-white md:mt-3">100% Private</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-300 line-clamp-2">
                All data stored locally. No accounts, no servers.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 md:p-5">
              <RefreshCw className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
              <h3 className="mt-2 text-sm font-semibold text-white md:mt-3">Live Prices</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-300 line-clamp-2">
                Auto-updating crypto &amp; stock prices.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 md:p-5">
              <Layers className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
              <h3 className="mt-2 text-sm font-semibold text-white md:mt-3">Track Anything</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-300 line-clamp-2">
                Crypto, stocks, real estate, cash — all in one place.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 md:p-5">
              <History className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
              <h3 className="mt-2 text-sm font-semibold text-white md:mt-3">Auto History</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-300 line-clamp-2">
                Net worth tracked automatically with charts.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 md:p-5">
              <Eye className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
              <h3 className="mt-2 text-sm font-semibold text-white md:mt-3">Privacy Mode</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-300 line-clamp-2">
                Hide all values with one tap.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 md:p-5">
              <FolderOpen className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
              <h3 className="mt-2 text-sm font-semibold text-white md:mt-3">Categories</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-300 line-clamp-2">
                Organize assets into groups and categories.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 md:p-5">
              <Download className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
              <h3 className="mt-2 text-sm font-semibold text-white md:mt-3">Export &amp; Import</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-300 line-clamp-2">
                Back up as JSON. Move between devices.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 md:p-5">
              <Wifi className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
              <h3 className="mt-2 text-sm font-semibold text-white md:mt-3">Works Offline</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-300 line-clamp-2">
                Install as a PWA, access anytime.
              </p>
            </div>
            <div className="hidden md:block rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 md:p-5">
              <Palette className="h-5 w-5 text-emerald-500" />
              <h3 className="mt-3 text-sm font-semibold text-white">Themes</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-300 line-clamp-2">
                Multiple dark themes to match your style.
              </p>
            </div>
          </div>

          <p className="mt-8 flex items-center justify-center gap-2 text-sm text-zinc-500">
            <Sparkles className="h-4 w-4 text-emerald-500/60" />
            More features coming soon
          </p>
        </FadeSection>

        <div className="mx-auto max-w-5xl px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
        </div>

        {/* ── FAQ ── */}
        <FAQSection />

        {/* ── CTA ── */}
        <CTASection />

        {/* ── Footer ── */}
        <footer className="border-t border-zinc-800/60 px-6 py-10">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div>
              <span className="text-base font-bold text-white">
                Dash<span className="text-emerald-500">worth</span>
              </span>
              <p className="mt-1 text-xs text-zinc-500">
                Your wealth. Your data. Your dashboard.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/vaclavik-xyz/dashworth"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-white"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
              <span className="text-xs text-zinc-600">&copy; 2026</span>
            </div>
          </div>
        </footer>
      </div>
    </InstallProvider>
  );
}
