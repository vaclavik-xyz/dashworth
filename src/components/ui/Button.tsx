"use client";

import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-emerald-600 text-white hover:bg-emerald-700",
  secondary: "bg-zinc-800 text-zinc-200 hover:bg-zinc-700",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-zinc-400 hover:text-white hover:bg-zinc-800",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
