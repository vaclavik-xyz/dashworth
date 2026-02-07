import {
  Bitcoin,
  TrendingUp,
  Home,
  Globe,
  Gamepad2,
  Banknote,
  Car,
  Gem,
  Box,
  HelpCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  bitcoin: Bitcoin,
  "trending-up": TrendingUp,
  home: Home,
  globe: Globe,
  "gamepad-2": Gamepad2,
  banknote: Banknote,
  car: Car,
  gem: Gem,
  box: Box,
};

export function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? HelpCircle;
}
