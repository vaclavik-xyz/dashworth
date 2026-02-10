"use client";

import { useEffect, useRef, useState } from "react";
import {
  Shield,
  Layers,
  RefreshCw,
  ChevronDown,
  ArrowRight,
  Share,
  TrendingUp,
  TrendingDown,
  Pencil,
  Bitcoin,
  Banknote,
} from "lucide-react";
import { useLandingActions } from "@/components/ClientRouter";
import { useInstall } from "./InstallProvider";

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

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const cards = el.firstElementChild?.children;
    if (!cards?.[2]) return;
    const card = cards[2] as HTMLElement;
    el.scrollLeft = card.offsetLeft - (el.clientWidth - card.clientWidth) / 2;
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const children = el.firstElementChild?.children;
      if (!children?.[1]) return;
      const firstCard = children[1] as HTMLElement;
      const w = firstCard.offsetWidth + 16;
      const offset = el.scrollLeft - firstCard.offsetLeft + firstCard.offsetWidth / 2;
      setActiveIdx(Math.max(0, Math.min(Math.round(offset / w), 2)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const card =
    "shrink-0 w-[75vw] max-w-[280px] rounded-2xl border border-zinc-800 bg-zinc-900 p-3 md:p-4 shadow-lg shadow-black/20 md:w-auto md:max-w-none";

  return (
    <div className="relative w-screen -mx-6 mt-5 sm:mt-8 md:mx-0 md:w-[720px] lg:w-[860px]">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#09090b] to-transparent md:hidden" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#09090b] to-transparent md:hidden" />
      <div
        ref={scrollRef}
        className="overflow-x-auto snap-x snap-mandatory scrollbar-hide md:overflow-visible"
      >
        <div className="flex gap-4 md:grid md:grid-cols-3 md:gap-6 md:px-0">
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
                    <a.icon className={`h-4 w-4 shrink-0 ${a.color}`} />
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

          {/* Card 2: Net Worth + Interactive Chart */}
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
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
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

              {CHART_POINTS.map((p, i) => (
                <button
                  key={i}
                  aria-label={`Show value for ${p.label}`}
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

          <div className="shrink-0 w-[calc(50vw-140px)] md:hidden" aria-hidden />
        </div>
      </div>

      {/* Dot indicators — mobile only */}
      <div className="mt-1 flex justify-center gap-1.5 md:hidden">
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

/* ───────────────────────── Hero Section ───────────────────────── */

export default function HeroSection() {
  const { onStart } = useLandingActions();
  const { showInstallCard, isIosSafari, deferredPrompt, handleAndroidInstall } = useInstall();

  return (
    <div
      className={`animate-hero-in relative flex min-h-[100dvh] flex-col items-center px-6 text-center${
        showInstallCard
          ? " pb-3 md:justify-center md:pb-0"
          : " justify-center"
      }`}
    >
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[30%] h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.08] blur-[120px]" />
        <div className="absolute right-[-10%] top-[70%] h-[400px] w-[400px] rounded-full bg-emerald-600/[0.05] blur-[100px]" />
        <div className="absolute left-[-5%] top-[10%] h-[300px] w-[300px] rounded-full bg-teal-500/[0.04] blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#09090b_100%)]" />
      </div>

      <div className={`relative${showInstallCard ? " flex flex-1 flex-col items-center justify-center pt-[5vh] md:flex-none md:pt-0" : ""}`}>
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
        <div className="mx-auto mt-5 grid max-w-xs grid-cols-3 gap-x-2 sm:mt-8 sm:max-w-md sm:gap-x-6">
          <div className="flex flex-col items-center gap-1.5">
            <Shield className="h-5 w-5 text-emerald-500" />
            <p className="text-sm font-semibold text-white">100% Private</p>
            <p className="text-xs text-zinc-300">On-device only</p>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <RefreshCw className="h-5 w-5 text-emerald-500" />
            <p className="text-sm font-semibold text-white">Live Prices</p>
            <p className="text-xs text-zinc-300">Crypto &amp; stocks</p>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Layers className="h-5 w-5 text-emerald-500" />
            <p className="text-sm font-semibold text-white">All Assets</p>
            <p className="text-xs text-zinc-300">Track anything</p>
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
            onClick={onStart}
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
                  Works offline, data stays on-device
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
            onClick={onStart}
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
  );
}
