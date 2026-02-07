import type { CustomThemeColors, Theme } from "@/types";

const CUSTOM_VAR_NAMES = [
  "--dw-bg",
  "--dw-card",
  "--dw-nav",
  "--dw-input",
  "--dw-input-border",
  "--dw-border",
  "--dw-hover",
  "--dw-grid",
  "--tooltip-bg",
  "--tooltip-border",
  "--tooltip-text",
  "--tooltip-label",
];

function deriveCustomVars(colors: CustomThemeColors): Record<string, string> {
  const isDark = colors.base === "dark";
  return {
    "--dw-bg": colors.bg,
    "--dw-card": colors.card,
    "--dw-nav": colors.bg,
    "--dw-input": colors.card,
    "--dw-input-border": colors.border,
    "--dw-border": colors.border,
    "--dw-hover": colors.border,
    "--dw-grid": colors.border,
    "--tooltip-bg": colors.card,
    "--tooltip-border": colors.border,
    "--tooltip-text": isDark ? "#fafafa" : "#09090b",
    "--tooltip-label": isDark ? "#a1a1aa" : "#71717a",
  };
}

function clearCustomVars(html: HTMLElement): void {
  for (const name of CUSTOM_VAR_NAMES) {
    html.style.removeProperty(name);
  }
}

export function applyTheme(theme: Theme, customTheme?: CustomThemeColors): void {
  const html = document.documentElement;

  if (theme === "custom" && customTheme) {
    html.classList.toggle("dark", customTheme.base === "dark");
    html.setAttribute("data-theme", "custom");
    const vars = deriveCustomVars(customTheme);
    for (const [key, value] of Object.entries(vars)) {
      html.style.setProperty(key, value);
    }
    return;
  }

  // For all non-custom themes, clear any inline overrides
  clearCustomVars(html);

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
