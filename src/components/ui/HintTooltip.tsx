"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { HelpCircle } from "lucide-react";
import { db } from "@/lib/db";

interface HintTooltipProps {
  text: string;
  children?: ReactNode;
}

export default function HintTooltip({ text, children }: HintTooltipProps) {
  const settings = useLiveQuery(() => db.settings.get("settings"));
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [open]);

  if (settings?.showHints === false) return children ?? null;

  return (
    <span className="relative inline-flex items-center" ref={ref}>
      {children}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="ml-1 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-zinc-400 hover:bg-zinc-600 hover:text-zinc-300 transition-colors"
        aria-label="Help"
      >
        <HelpCircle className="h-2.5 w-2.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-zinc-300 shadow-lg">
          {text}
        </div>
      )}
    </span>
  );
}
