"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import FadeSection from "./FadeSection";

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
          <p className="text-sm leading-relaxed text-zinc-300">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function FAQSection() {
  return (
    <FadeSection className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
      <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
        FAQ
      </h2>
      <div className="mt-8">
        {FAQ_ITEMS.map(({ q, a }) => (
          <FaqItem key={q} q={q} a={a} />
        ))}
      </div>
    </FadeSection>
  );
}
