import type { Theme } from "@/types";

export function applyTheme(theme: Theme): void {
  const html = document.documentElement;

  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    html.classList.toggle("dark", prefersDark);
    html.removeAttribute("data-theme");
  } else if (theme === "light") {
    html.classList.remove("dark");
    html.setAttribute("data-theme", "light");
  } else if (theme === "midnight") {
    html.classList.add("dark");
    html.setAttribute("data-theme", "midnight");
  } else if (theme === "emerald-dark") {
    html.classList.add("dark");
    html.setAttribute("data-theme", "emerald-dark");
  } else {
    // "dark"
    html.classList.add("dark");
    html.removeAttribute("data-theme");
  }
}

export function watchSystemTheme(callback: () => void): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
