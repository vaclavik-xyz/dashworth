"use client";

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export default function Card({ className = "", children }: CardProps) {
  return (
    <div className={`rounded-xl border border-[var(--dw-border)] bg-[var(--dw-card)] p-4 ${className}`}>
      {children}
    </div>
  );
}
