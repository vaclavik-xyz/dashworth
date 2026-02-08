"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LayoutDashboard, Wallet, Camera } from "lucide-react";
import { ExampleDataProvider, useExampleData } from "@/contexts/ExampleDataContext";

function ExampleHeader({ slug }: { slug: string }) {
  const data = useExampleData();
  const pathname = usePathname();
  if (!data) return null;

  const { portfolio } = data;
  const base = `/examples/${slug}`;

  const tabs = [
    { label: "Dashboard", href: base, icon: LayoutDashboard },
    { label: "Assets", href: `${base}/assets`, icon: Wallet },
    { label: "Snapshots", href: `${base}/snapshots`, icon: Camera },
  ];

  return (
    <>
      <Link
        href="/examples"
        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to examples
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white ${portfolio.color}`}>
          {portfolio.initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{portfolio.name}</h1>
          <p className="text-sm text-zinc-500">{portfolio.description}</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b border-[var(--dw-border)]">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                isActive
                  ? "border-emerald-500 text-emerald-500"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </>
  );
}

export default function ExampleSlugShell({ slug, children }: { slug: string; children: React.ReactNode }) {
  return (
    <ExampleDataProvider slug={slug}>
      <div className="p-6 md:p-10">
        <ExampleHeader slug={slug} />
        {children}
      </div>
    </ExampleDataProvider>
  );
}
