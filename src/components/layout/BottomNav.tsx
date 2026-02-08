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

export default function BottomNav() {
  const pathname = usePathname();
  const { isOverdue } = useSnapshotOverdue();
  const settings = useLiveQuery(() => db.settings.get("settings"));
  const hintsOn = settings?.showHints !== false;

  async function toggleHints() {
    await db.settings.update("settings", { showHints: !hintsOn });
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 flex items-end md:hidden border-t border-[var(--dw-border)] bg-[var(--dw-nav)] pb-[env(safe-area-inset-bottom)]">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        const showDot = href === "/snapshots" && isOverdue;

        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
              isActive ? "text-emerald-500" : "text-zinc-500"
            }`}
          >
            <span className="relative">
              <Icon className="h-7 w-7" />
              {showDot && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500" />
              )}
            </span>
            {label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={toggleHints}
        className={`flex flex-col items-center gap-0.5 py-2 px-3 text-xs font-medium transition-colors ${
          hintsOn ? "text-emerald-500" : "text-zinc-500"
        }`}
      >
        <HelpCircle className="h-5 w-5" />
      </button>
    </nav>
  );
}
