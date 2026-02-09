"use client";

import { useEffect, useRef, useState } from "react";
import { X, ArrowLeft } from "lucide-react";

interface SlidePanelProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function SlidePanel({ open, onClose, title, children }: SlidePanelProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [shieldActive, setShieldActive] = useState(false);

  useEffect(() => {
    if (open) {
      setShieldActive(false);
    } else {
      setShieldActive(true);
      const t = setTimeout(() => setShieldActive(false), 350);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open && shieldActive) {
    return <div className="fixed inset-0 z-50" />;
  }

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Desktop: slide-in panel from right */}
      <div className="hidden md:flex w-[450px] h-full flex-col bg-[var(--dw-card)] border-l border-[var(--dw-border)] shadow-xl animate-slide-in-right">
        {title && (
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--dw-border)] px-5 py-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>

      {/* Mobile: full-screen overlay */}
      <div className="md:hidden w-full h-full flex flex-col bg-[var(--dw-bg)]">
        <div className="flex shrink-0 items-center gap-3 px-4 py-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)]">
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          {title && <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h2>}
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>
      </div>
    </div>
  );
}
