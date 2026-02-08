"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Layers,
  RefreshCw,
  ChevronDown,
  Github,
  ArrowRight,
  Share,
  TrendingUp,
  TrendingDown,
  Pencil,
  Bitcoin,
  Banknote,
  Eye,
  Download,
  History,
  FolderOpen,
  Palette,
  Wifi,
  Sparkles,
} from "lucide-react";

/* ───────────────────────── Fade-in on scroll ───────────────────────── */

function useFadeIn<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("opacity-100", "translate-y-0");
          el.classList.remove("opacity-0", "translate-y-6");
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useFadeIn<HTMLDivElement>();
  return (
    <section
      ref={ref}
      className={`opacity-0 translate-y-6 transition-all duration-700 ease-out ${className}`}
    >
      {children}
    </section>
  );
}

/* ───────────────────────── FAQ Accordion ───────────────────────── */

const FAQ_ITEMS = [
  {
    q: "Where is my data stored?",
    a: "All data is stored locally in your browser using IndexedDB. Nothing is sent to any server \u2014 there are no accounts, no cloud sync, and no analytics. Your portfolio data exists only on this device, in this browser. To keep your data safe, install the app to your home screen and export backups regularly via Settings \u2192 Export.",
  },
  {
    q: "Can I lose my data?",
    a: "Your data is stored in your browser\u2019s local storage (IndexedDB). It\u2019s private and never leaves your device, but it can be lost if you clear your browser data, reinstall your browser, or reset your device. On iOS Safari without installing the app, data may be automatically deleted after 7 days of inactivity. We strongly recommend installing Dashworth to your home screen and using the Export feature regularly to create backups.",
  },
  {
    q: "Can I use it on multiple devices?",
    a: "You can export your data as a JSON file and import it on another device.",
  },
  {
    q: "Is it free?",
    a: "Yes! Dashworth is free to use with all core features \u2014 asset tracking, live prices, charts, and data export. We may introduce optional premium features in the future, but everything you need to track your net worth will always be free.",
  },
  {
    q: "What assets can I track?",
    a: "Anything with value \u2014 crypto, stocks, real estate, domains, vehicles, collectibles, gaming items, cash, and more.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-zinc-800">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left text-base font-medium text-white transition-colors hover:text-emerald-400"
      >
        {q}
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ${
          open ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-sm leading-relaxed text-zinc-400">{a}</p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Mockup Data ───────────────────────── */

const CHART_POINTS = [
  { x: 0,   y: 85200,  label: "Jul 2025" },
  { x: 28,  y: 88400,  label: "Aug 2025" },
  { x: 57,  y: 86100,  label: "Sep 2025" },
  { x: 85,  y: 91700,  label: "Oct 2025" },
  { x: 114, y: 94300,  label: "Nov 2025" },
  { x: 142, y: 92800,  label: "Dec 2025" },
  { x: 171, y: 98600,  label: "Jan 2026" },
  { x: 200, y: 102480, label: "Feb 2026" },
];

const TOP_ASSETS = [
  { name: "Bitcoin",         icon: Bitcoin,    color: "text-orange-400", value: "$38,500" },
  { name: "AAPL",            icon: TrendingUp, color: "text-blue-400",   value: "$27,400" },
  { name: "Bank",             icon: Banknote,   color: "text-green-400",  value: "$18,200" },
  { name: "Ethereum",        icon: Bitcoin,    color: "text-orange-400", value: "$12,400" },
  { name: "Savings Account", icon: Banknote,   color: "text-green-400",  value: "$5,980" },
];

const NW_ENTRIES = [
  { date: "Feb 8, 2026",  value: "$102,480", delta: "+$2,400",  pct: "+2.4%",  up: true,  source: "auto" as const },
  { date: "Feb 5, 2026",  value: "$100,080", delta: "-$800",    pct: "-0.8%",  up: false, source: "auto" as const },
  { date: "Feb 2, 2026",  value: "$100,880", delta: "+$400",    pct: "+0.4%",  up: true,  source: "manual" as const },
];

const CHANGE_ENTRIES = [
  {
    name: "Bitcoin", icon: Bitcoin, color: "text-orange-400",
    date: "Feb 8, 2026", source: "auto" as const,
    old: "$36,100", new_: "$38,500", delta: "+$2,400", pct: "+6.6%", up: true,
  },
  {
    name: "AAPL", icon: TrendingUp, color: "text-blue-400",
    date: "Feb 5, 2026", source: "auto" as const,
    old: "$28,200", new_: "$27,400", delta: "-$800", pct: "-2.8%", up: false,
    note: "post-earnings dip",
  },
  {
    name: "Bank", icon: Banknote, color: "text-green-400",
    date: "Feb 2, 2026", source: "manual" as const,
    old: "$17,800", new_: "$18,200", delta: "+$400", pct: "+2.2%", up: true,
  },
];

/* ───────────────────────── Hero Carousel ───────────────────────── */

function HeroCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(1);
  const [activePoint, setActivePoint] = useState<number | null>(null);
  const [historyTab, setHistoryTab] = useState<"networth" | "changes">(
    "networth"
  );

  // Chart calculations (same as MockupGrid)
  const svgW = 200,
    svgH = 70,
    padTop = 10,
    padBot = 10;
  const minY = Math.min(...CHART_POINTS.map((p) => p.y));
  const maxY = Math.max(...CHART_POINTS.map((p) => p.y));
  const scaleY = (v: number) =>
    padTop + ((maxY - v) / (maxY - minY)) * (svgH - padTop - padBot);
  const polyline = CHART_POINTS.map((p) => `${p.x},${scaleY(p.y)}`).join(" ");
  const areaFill = `${polyline} ${svgW},${svgH} 0,${svgH}`;

  // Scroll to center card (chart) on mount
  // Children: [spacer, card0, card1, card2, spacer]
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const cards = el.firstElementChild?.children;
    if (!cards?.[2]) return;
    const card = cards[2] as HTMLElement; // chart card (index 2, after spacer)
    el.scrollLeft = card.offsetLeft - (el.clientWidth - card.clientWidth) / 2;
  }, []);

  // Track active card
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const children = el.firstElementChild?.children;
      if (!children?.[1]) return;
      const firstCard = children[1] as HTMLElement; // skip spacer
      const w = firstCard.offsetWidth + 16; // card width + gap
      const offset = el.scrollLeft - firstCard.offsetLeft + firstCard.offsetWidth / 2;
      setActiveIdx(Math.max(0, Math.min(Math.round(offset / w), 2)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const card =
    "shrink-0 w-[75vw] max-w-[280px] rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-lg shadow-black/20 md:w-auto md:max-w-none";

  return (
    <div className="w-screen -mx-6 mt-8 sm:mt-8 md:mx-0 md:w-full">
      <div
        ref={scrollRef}
        className="overflow-x-auto snap-x snap-mandatory scrollbar-hide md:overflow-visible"
      >
        <div className="flex gap-4 md:grid md:grid-cols-3 md:gap-6 md:px-0">
          {/* Spacer for snap centering */}
          <div className="shrink-0 w-[calc(50vw-140px)] md:hidden" aria-hidden />
          {/* Card 1: Top Assets */}
          <div className={`${card} snap-center`}>
            <h2 className="mb-3 text-sm font-medium text-zinc-400">
              Top Assets
            </h2>
            <div className="space-y-2">
              {TOP_ASSETS.map((a) => (
                <div
                  key={a.name}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <a.icon
                      className={`h-4 w-4 shrink-0 ${a.color}`}
                    />
                    <span className="text-sm text-white truncate">
                      {a.name}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-white">
                    {a.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Net Worth + Interactive Chart (center on mobile) */}
          <div className={`${card} snap-center`}>
            <p className="text-sm text-zinc-500">Total net worth</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-white">
              $102,480
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">
                +$2,400 (+2.4%)
              </span>
              <span className="text-[10px] text-zinc-600">vs previous</span>
            </div>

            <div className="relative mt-3">
              <svg
                viewBox={`0 0 ${svgW} ${svgH}`}
                className="h-14 w-full"
                preserveAspectRatio="none"
              >
                <linearGradient
                  id="heroChartFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#10b981"
                    stopOpacity="0.2"
                  />
                  <stop
                    offset="100%"
                    stopColor="#10b981"
                    stopOpacity="0"
                  />
                </linearGradient>
                <polygon points={areaFill} fill="url(#heroChartFill)" />
                <polyline
                  points={polyline}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* Dots as HTML elements to stay perfectly round */}
              {CHART_POINTS.map((p, i) => (
                <button
                  key={i}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${(p.x / svgW) * 100}%`,
                    top: `${(scaleY(p.y) / svgH) * 100}%`,
                    width: 24,
                    height: 24,
                  }}
                  onClick={() => setActivePoint(activePoint === i ? null : i)}
                >
                  <span
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-emerald-500"
                    style={{
                      width: activePoint === i ? 10 : 6,
                      height: activePoint === i ? 10 : 6,
                      background: activePoint === i ? "#10b981" : "#09090b",
                    }}
                  />
                </button>
              ))}

              {activePoint !== null && (
                <div
                  className="absolute z-10 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs shadow-lg pointer-events-none"
                  style={{
                    left: `${(CHART_POINTS[activePoint].x / svgW) * 100}%`,
                    top: -4,
                    transform: "translate(-50%, -100%)",
                  }}
                >
                  <p className="text-zinc-400">
                    {CHART_POINTS[activePoint].label}
                  </p>
                  <p className="font-medium text-white">
                    ${CHART_POINTS[activePoint].y.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-2 flex justify-center gap-2 text-[10px] text-zinc-500">
              <span>Crypto 50%</span>
              <span className="text-zinc-700">&middot;</span>
              <span>Stocks 27%</span>
              <span className="text-zinc-700">&middot;</span>
              <span>Cash 24%</span>
            </div>
          </div>

          {/* Card 3: History / Changes */}
          <div className={`${card} snap-center`}>
            <div className="mb-2 flex items-center gap-1 rounded-lg bg-zinc-800/60 p-0.5">
              <button
                onClick={() => setHistoryTab("networth")}
                className={`flex-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                  historyTab === "networth"
                    ? "bg-zinc-700 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Net Worth
                <span
                  className={`ml-1 text-[10px] ${historyTab === "networth" ? "text-emerald-500" : "text-zinc-400"}`}
                >
                  3
                </span>
              </button>
              <button
                onClick={() => setHistoryTab("changes")}
                className={`flex-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                  historyTab === "changes"
                    ? "bg-zinc-700 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Changes
                <span
                  className={`ml-1 text-[10px] ${historyTab === "changes" ? "text-emerald-500" : "text-zinc-400"}`}
                >
                  3
                </span>
              </button>
            </div>

            <div className="space-y-2.5">
              {historyTab === "networth"
                ? NW_ENTRIES.map((e) => (
                    <div
                      key={e.date}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {e.up ? (
                          <TrendingUp className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 shrink-0 text-red-500" />
                        )}
                        <span className="text-sm text-white truncate">
                          {e.date}
                        </span>
                        {e.source === "auto" ? (
                          <RefreshCw className="h-2.5 w-2.5 shrink-0 text-blue-400/60" />
                        ) : (
                          <Pencil className="h-2.5 w-2.5 shrink-0 text-zinc-500/60" />
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-medium text-white">
                          {e.value}
                        </p>
                        <p
                          className={`text-xs ${e.up ? "text-emerald-500" : "text-red-500"}`}
                        >
                          {e.delta} ({e.pct})
                        </p>
                      </div>
                    </div>
                  ))
                : CHANGE_ENTRIES.map((e) => (
                    <div
                      key={e.name}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <e.icon
                          className={`h-3.5 w-3.5 shrink-0 ${e.color}`}
                        />
                        <span className="text-sm text-white truncate">
                          {e.name}
                        </span>
                        {e.source === "auto" ? (
                          <RefreshCw className="h-2.5 w-2.5 shrink-0 text-blue-400/60" />
                        ) : (
                          <Pencil className="h-2.5 w-2.5 shrink-0 text-zinc-500/60" />
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm text-white">
                          {e.old} → {e.new_}
                        </p>
                        <p
                          className={`text-xs font-medium ${e.up ? "text-emerald-500" : "text-red-500"}`}
                        >
                          {e.delta} ({e.pct})
                        </p>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
          {/* Spacer for snap centering */}
          <div className="shrink-0 w-[calc(50vw-140px)] md:hidden" aria-hidden />
        </div>
      </div>

      {/* Dot indicators — mobile only */}
      <div className="mt-3 flex justify-center gap-1.5 md:hidden">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              activeIdx === i ? "bg-emerald-500" : "bg-zinc-600"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── Landing Page ───────────────────────── */

export default function LandingPage({ onStart }: { onStart?: () => void }) {
  const router = useRouter();
  const handleStart = onStart ?? (() => router.push("/assets"));

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

  const showInstallCard =
    !isStandalone && (isIosSafari || !!deferredPrompt);

  const handleSkip = () => {
    handleStart();
  };

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    (deferredPrompt as any).prompt();
    const { outcome } = await (deferredPrompt as any).userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#09090b]">
      {/* ── Hero ── */}
      <div
        className={`relative flex min-h-[100dvh] flex-col items-center px-6 text-center${
          showInstallCard
            ? " justify-between pt-[8vh] pb-6 md:justify-center md:pt-0 md:pb-0"
            : " justify-center"
        }`}
      >
        {/* Subtle radial glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.07] blur-[120px]" />
        </div>

        {/* Top spacer removed — pt-[12vh] handles positioning */}

        <div className="relative">
          {/* Logo */}
          <div className="mb-3 sm:mb-6 flex items-center justify-center gap-4">
            <img src="/icons/icon-192x192.png" alt="Dashworth" className="h-14 w-14 rounded-2xl sm:h-16 sm:w-16" />
            <span className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
              Dash<span className="text-emerald-500">worth</span>
            </span>
          </div>

          {/* Headline */}
          <h1 className="mx-auto max-w-3xl text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-6xl">
            Track your net worth.{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
              Privately.
            </span>
          </h1>

          {/* Feature badges */}
          <div className="mx-auto mt-6 grid max-w-xs grid-cols-3 gap-x-2 sm:mt-8 sm:max-w-md sm:gap-x-6">
            <div className="flex flex-col items-center gap-1.5">
              <Shield className="h-5 w-5 text-emerald-500" />
              <p className="text-sm font-semibold text-white">100% Private</p>
              <p className="text-xs text-zinc-400">On-device only</p>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <RefreshCw className="h-5 w-5 text-emerald-500" />
              <p className="text-sm font-semibold text-white">Live Prices</p>
              <p className="text-xs text-zinc-400">Crypto &amp; stocks</p>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Layers className="h-5 w-5 text-emerald-500" />
              <p className="text-sm font-semibold text-white">All Assets</p>
              <p className="text-xs text-zinc-400">Track anything</p>
            </div>
          </div>

          {/* Mockup carousel */}
          <HeroCarousel />

          {/* CTA — always on desktop, on mobile when install card not shown */}
          <div
            className={`mt-5 sm:mt-10 flex flex-col items-center gap-3${
              showInstallCard ? " hidden md:flex" : ""
            }`}
          >
            <button
              onClick={handleStart}
              className="group inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/30 active:scale-[0.98]"
            >
              Start Tracking — It&apos;s Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <span className="text-xs text-zinc-500">No sign-up required</span>
          </div>
        </div>

        {/* Install section — pinned to bottom on mobile */}
        {showInstallCard && (
          <div className="flex w-full flex-col items-center md:hidden">
            <div className="w-full max-w-sm rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] px-5 py-3.5 shadow-lg shadow-emerald-500/[0.05]">
              {isIosSafari ? (
                <>
                  <p className="text-sm font-medium text-white">
                    Tap{" "}
                    <Share className="inline h-4 w-4 -translate-y-px text-emerald-400" />{" "}
                    below →{" "}
                    <span className="font-semibold">
                      &quot;Add to Home Screen&quot;
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Your data stays on-device
                  </p>
                </>
              ) : deferredPrompt ? (
                <button
                  onClick={handleAndroidInstall}
                  className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 active:scale-[0.98]"
                >
                  Install Dashworth
                </button>
              ) : null}
            </div>
            <button
              onClick={handleSkip}
              className="mt-2 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
            >
              Skip, start in browser →
            </button>
            <ChevronDown className="mt-2 h-5 w-5 animate-bounce text-emerald-500/50" />
          </div>
        )}

        {/* Scroll hint — non-install state */}
        {!showInstallCard && (
          <div className="absolute bottom-8 animate-bounce text-zinc-600">
            <ChevronDown className="h-6 w-6" />
          </div>
        )}
      </div>

      {/* ── Features ── */}
      <Section className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
          Features
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-sm text-zinc-400">
          Everything you need to track and understand your wealth.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 md:p-5">
            <Shield className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
            <h3 className="mt-2 text-sm font-semibold text-white md:mt-3">100% Private</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400 line-clamp-2">
              All data stored locally. No accounts, no servers.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 md:p-5">
            <RefreshCw className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
            <h3 className="mt-2 text-sm font-semibold text-white md:mt-3">Live Prices</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400 line-clamp-2">
              Auto-updating crypto &amp; stock prices.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 md:p-5">
            <Layers className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
            <h3 className="mt-2 text-sm font-semibold text-white md:mt-3">Track Anything</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400 line-clamp-2">
              Crypto, stocks, real estate, cash — all in one place.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 md:p-5">
            <History className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
            <h3 className="mt-2 text-sm font-semibold text-white md:mt-3">Auto History</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400 line-clamp-2">
              Net worth tracked automatically with charts.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 md:p-5">
            <Eye className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
            <h3 className="mt-2 text-sm font-semibold text-white md:mt-3">Privacy Mode</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400 line-clamp-2">
              Hide all values with one tap.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 md:p-5">
            <FolderOpen className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
            <h3 className="mt-2 text-sm font-semibold text-white md:mt-3">Categories</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400 line-clamp-2">
              Organize assets into groups and categories.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 md:p-5">
            <Download className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
            <h3 className="mt-2 text-sm font-semibold text-white md:mt-3">Export &amp; Import</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400 line-clamp-2">
              Back up as JSON. Move between devices.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 md:p-5">
            <Wifi className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
            <h3 className="mt-2 text-sm font-semibold text-white md:mt-3">Works Offline</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400 line-clamp-2">
              Install as a PWA, access anytime.
            </p>
          </div>
          <div className="hidden md:block rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 md:p-5">
            <Palette className="h-5 w-5 text-emerald-500" />
            <h3 className="mt-3 text-sm font-semibold text-white">Themes</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400 line-clamp-2">
              Multiple dark themes to match your style.
            </p>
          </div>
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-sm text-zinc-500">
          <Sparkles className="h-4 w-4 text-emerald-500/60" />
          More features coming soon
        </p>
      </Section>

      <div className="mx-auto max-w-5xl px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      </div>

      {/* ── FAQ ── */}
      <Section className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
          FAQ
        </h2>

        <div className="mt-8">
          {FAQ_ITEMS.map(({ q, a }) => (
            <FaqItem key={q} q={q} a={a} />
          ))}
        </div>
      </Section>

      {/* ── CTA ── */}
      <Section className="px-6 py-16 sm:py-24 text-center">
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
                Your data stays on-device
              </p>
            </div>
            <button
              onClick={handleSkip}
              className="mt-3 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
            >
              Skip, start in browser →
            </button>
          </div>
        ) : null}
        <div
          className={showInstallCard ? "hidden md:block" : ""}
        >
          <button
            onClick={handleStart}
            className="group inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/30 active:scale-[0.98]"
          >
            Start Tracking
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <p className="mt-3 text-xs text-zinc-500">
            No sign-up required &middot; 100% private
          </p>
        </div>
      </Section>

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
  );
}
