"use client";

import { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const dragCurrentY = useRef(0);

  // Lock body scroll when open (mobile only — sheet is hidden on md+)
  useEffect(() => {
    if (!open) return;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobile) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragCurrentY.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    dragCurrentY.current = delta;
    // Only allow dragging down
    if (delta > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`;
      sheetRef.current.style.transition = "none";
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (sheetRef.current) {
      sheetRef.current.style.transition = "";
      if (dragCurrentY.current > 100) {
        onClose();
      } else {
        sheetRef.current.style.transform = "";
      }
    }
    dragStartY.current = null;
    dragCurrentY.current = 0;
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl border-t border-[var(--dw-border)] bg-[var(--dw-card)] shadow-xl translate-y-0 transition-transform duration-300 ease-out"
        style={{ animation: "slideUp 300ms ease-out" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle + close button */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl bg-[var(--dw-card)] px-4 pb-2 pt-3">
          <div className="flex-1" />
          <div className="h-1 w-8 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          <div className="flex flex-1 justify-end">
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-5 pb-20" style={{ maxHeight: "calc(85vh - 48px)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
