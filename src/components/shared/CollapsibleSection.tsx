"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

interface CollapsibleSectionProps {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function CollapsibleSection({ label, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ChevronRight
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
        {label}
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pt-3 space-y-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
