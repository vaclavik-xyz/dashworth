"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, Camera, Users, Settings, HelpCircle } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useSnapshotOverdue } from "@/hooks/useSnapshotOverdue";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assets", label: "Assets", icon: Wallet },
  { href: "/snapshots", label: "Snapshots", icon: Camera },
  { href: "/examples", label: "Examples", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOverdue } = useSnapshotOverdue();
  const settings = useLiveQuery(() => db.settings.get("settings"));
  const hintsOn = settings?.showHints !== false;

  async function toggleHints() {
    await db.settings.update("settings", { showHints: !hintsOn });
  }

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
          const showDot = href === "/snapshots" && isOverdue;

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
              <span className="relative">
                <Icon className="h-5 w-5" />
                {showDot && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500" />
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4">
        <button
          type="button"
          onClick={toggleHints}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors w-full ${
            hintsOn
              ? "text-emerald-500 hover:bg-emerald-500/10"
              : "text-zinc-400 hover:bg-[var(--dw-hover)] hover:text-zinc-200"
          }`}
        >
          <HelpCircle className="h-5 w-5" />
          Hints
        </button>
      </div>
    </aside>
  );
}
