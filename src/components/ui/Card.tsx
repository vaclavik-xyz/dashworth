"use client";

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export default function Card({ className = "", children }: CardProps) {
  return (
    <div className={`rounded-xl border border-zinc-800 bg-zinc-900 p-4 ${className}`}>
      {children}
    </div>
  );
}
