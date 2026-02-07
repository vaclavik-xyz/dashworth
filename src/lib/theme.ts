import type { Theme } from "@/types";

export function applyTheme(theme: Theme): void {
  const html = document.documentElement;

  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    html.classList.toggle("dark", prefersDark);
  } else {
    html.classList.toggle("dark", theme === "dark");
  }
}

export function watchSystemTheme(callback: () => void): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
