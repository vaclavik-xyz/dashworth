"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Keep an invisible overlay briefly after close to absorb ghost clicks on mobile
  const [shieldActive, setShieldActive] = useState(false);

  useEffect(() => {
    if (open) {
      setShieldActive(false);
    } else {
      // When modal closes, activate ghost-click shield
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

  // Invisible full-screen shield that absorbs ghost clicks after modal closes
  if (!open && shieldActive) {
    return <div className="fixed inset-0 z-[60]" />;
  }

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 pb-16 sm:p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-full sm:max-w-lg max-h-[calc(100vh-5rem)] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl bg-[var(--dw-card)] border border-[var(--dw-border)] shadow-xl flex flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--dw-border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
