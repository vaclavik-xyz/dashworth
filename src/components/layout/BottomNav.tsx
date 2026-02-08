"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, Camera, Settings } from "lucide-react";
import { useSnapshotOverdue } from "@/hooks/useSnapshotOverdue";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assets", label: "Assets", icon: Wallet },
  { href: "/snapshots", label: "Snapshots", icon: Camera },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { isOverdue } = useSnapshotOverdue();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex items-end md:hidden border-t border-[var(--dw-border)] bg-[var(--dw-nav)] pb-[env(safe-area-inset-bottom)]">
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
    </nav>
  );
}
