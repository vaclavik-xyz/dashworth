"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Layers,
  RefreshCw,
  BarChart3,
  ChevronDown,
  Github,
  ArrowRight,
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
    a: "Everything is stored locally in your browser using IndexedDB. Nothing is sent to any server.",
  },
  {
    q: "Can I use it on multiple devices?",
    a: "You can export your data as a JSON file and import it on another device.",
  },
  {
    q: "Is it really free?",
    a: "Yes, the core app is completely free. No hidden fees, no premium walls.",
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

/* ───────────────────────── Features ───────────────────────── */

const FEATURES = [
  {
    icon: Shield,
    title: "100% Private",
    desc: "Your data never leaves your device. No accounts, no servers, no tracking.",
  },
  {
    icon: Layers,
    title: "All Asset Types",
    desc: "Crypto, stocks, real estate, domains, gaming items \u2014 track anything with value.",
  },
  {
    icon: RefreshCw,
    title: "Auto Price Updates",
    desc: "Live prices for crypto and stocks. Set it once, stay updated.",
  },
  {
    icon: BarChart3,
    title: "Beautiful Insights",
    desc: "Charts, trends, allocation breakdowns. See your wealth grow over time.",
  },
];

const STEPS = [
  {
    num: "1",
    title: "Add your assets",
    desc: "List everything you own \u2014 from Bitcoin to real estate.",
  },
  {
    num: "2",
    title: "Take snapshots",
    desc: "Save your portfolio\u2019s value at any time. Or let auto-snapshots do it for you.",
  },
  {
    num: "3",
    title: "Watch it grow",
    desc: "Track trends, see allocation, and make smarter decisions.",
  },
];

/* ───────────────────────── Landing Page ───────────────────────── */

export default function LandingPage({ onStart }: { onStart?: () => void }) {
  const router = useRouter();
  const handleStart = onStart ?? (() => router.push("/assets"));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#09090b]">
      {/* ── Hero ── */}
      <div className="relative flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
        {/* Subtle radial glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.07] blur-[120px]" />
        </div>

        <div className="relative">
          <div className="mb-8 flex items-center justify-center gap-4">
            <img src="/icons/icon-192x192.png" alt="Dashworth" className="h-16 w-16 rounded-2xl" />
            <span className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Dash<span className="text-emerald-500">worth</span>
            </span>
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl">
            Track your net worth.{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
              Privately.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            All your assets in one dashboard. No accounts, no cloud, no data
            sharing. Everything stays on your device.
          </p>
          <p className="mt-4 text-sm font-medium italic text-zinc-500">
            Not just a dashboard. It&apos;s your worth.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3">
            <button
              onClick={handleStart}
              className="group inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/30 active:scale-[0.98]"
            >
              Start Tracking — It&apos;s Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <span className="text-xs text-zinc-500">
              No sign-up required
            </span>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 animate-bounce text-zinc-600">
          <ChevronDown className="h-6 w-6" />
        </div>
      </div>

      {/* ── Features ── */}
      <Section className="mx-auto max-w-5xl px-6 py-24">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
          Why Dashworth?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-sm text-zinc-500">
          A net worth tracker that respects your privacy
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6 transition-colors hover:border-zinc-700"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                <Icon className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── How it works ── */}
      <Section className="mx-auto max-w-3xl px-6 py-24">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
          How it works
        </h2>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {STEPS.map(({ num, title, desc }) => (
            <div key={num} className="text-center sm:text-left">
              <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-bold text-emerald-400 sm:mx-0">
                {num}
              </div>
              <h3 className="text-base font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── FAQ ── */}
      <Section className="mx-auto max-w-2xl px-6 py-24">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
          Frequently asked questions
        </h2>

        <div className="mt-12">
          {FAQ_ITEMS.map(({ q, a }) => (
            <FaqItem key={q} q={q} a={a} />
          ))}
        </div>
      </Section>

      {/* ── CTA ── */}
      <Section className="px-6 py-24 text-center">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Ready to take control?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-zinc-400">
          Start tracking your net worth in seconds. No accounts needed.
        </p>
        <button
          onClick={handleStart}
          className="group mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/30 active:scale-[0.98]"
        >
          Start Tracking — It&apos;s Free
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
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
