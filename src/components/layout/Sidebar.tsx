"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, Camera, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assets", label: "Assets", icon: Wallet },
  { href: "/snapshots", label: "Snapshots", icon: Camera },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r border-[var(--dw-border)] bg-[var(--dw-nav)]">
      <div className="flex h-14 items-center px-6">
        <span className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
          Dash<span className="text-emerald-500">worth</span>
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "text-zinc-500 hover:bg-[var(--dw-hover)] hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
