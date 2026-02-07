import {
  // Finance
  Wallet,
  CreditCard,
  PiggyBank,
  Landmark,
  Receipt,
  BadgeDollarSign,
  CircleDollarSign,
  HandCoins,
  Banknote,
  // Crypto
  Bitcoin,
  Blocks,
  Cpu,
  Server,
  // Investments
  TrendingUp,
  BarChart3,
  LineChart,
  CandlestickChart,
  // Real Estate
  Home,
  Building,
  Building2,
  Hotel,
  Warehouse,
  Castle,
  // Vehicles
  Car,
  Bike,
  Ship,
  Plane,
  // Valuables
  Gem,
  Watch,
  Crown,
  Diamond,
  // Digital
  Globe,
  Monitor,
  Smartphone,
  HardDrive,
  Database,
  // Gaming
  Gamepad2,
  Sword,
  Shield,
  Trophy,
  Joystick,
  // Other
  Box,
  Package,
  ShoppingBag,
  Gift,
  Key,
  Lock,
  Star,
  Heart,
  Briefcase,
  Music,
  Palette,
  Camera,
  HelpCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  // Finance
  wallet: Wallet,
  "credit-card": CreditCard,
  "piggy-bank": PiggyBank,
  landmark: Landmark,
  receipt: Receipt,
  "badge-dollar-sign": BadgeDollarSign,
  "circle-dollar-sign": CircleDollarSign,
  "hand-coins": HandCoins,
  banknote: Banknote,
  // Crypto
  bitcoin: Bitcoin,
  blocks: Blocks,
  cpu: Cpu,
  server: Server,
  // Investments
  "trending-up": TrendingUp,
  "bar-chart-3": BarChart3,
  "line-chart": LineChart,
  "candlestick-chart": CandlestickChart,
  // Real Estate
  home: Home,
  building: Building,
  "building-2": Building2,
  hotel: Hotel,
  warehouse: Warehouse,
  castle: Castle,
  // Vehicles
  car: Car,
  bike: Bike,
  ship: Ship,
  plane: Plane,
  // Valuables
  gem: Gem,
  watch: Watch,
  crown: Crown,
  diamond: Diamond,
  // Digital
  globe: Globe,
  monitor: Monitor,
  smartphone: Smartphone,
  "hard-drive": HardDrive,
  database: Database,
  // Gaming
  "gamepad-2": Gamepad2,
  sword: Sword,
  shield: Shield,
  trophy: Trophy,
  joystick: Joystick,
  // Other
  box: Box,
  package: Package,
  "shopping-bag": ShoppingBag,
  gift: Gift,
  key: Key,
  lock: Lock,
  star: Star,
  heart: Heart,
  briefcase: Briefcase,
  music: Music,
  palette: Palette,
  camera: Camera,
};

export function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? HelpCircle;
}

export const ICON_GROUPS: { label: string; icons: string[] }[] = [
  {
    label: "Finance",
    icons: ["wallet", "credit-card", "piggy-bank", "landmark", "receipt", "badge-dollar-sign", "circle-dollar-sign", "hand-coins", "banknote"],
  },
  {
    label: "Crypto",
    icons: ["bitcoin", "blocks", "cpu", "server"],
  },
  {
    label: "Investments",
    icons: ["trending-up", "bar-chart-3", "line-chart", "candlestick-chart"],
  },
  {
    label: "Real Estate",
    icons: ["home", "building", "building-2", "hotel", "warehouse", "castle"],
  },
  {
    label: "Vehicles",
    icons: ["car", "bike", "ship", "plane"],
  },
  {
    label: "Valuables",
    icons: ["gem", "watch", "crown", "diamond"],
  },
  {
    label: "Digital",
    icons: ["globe", "monitor", "smartphone", "hard-drive", "database"],
  },
  {
    label: "Gaming",
    icons: ["gamepad-2", "sword", "shield", "trophy", "joystick"],
  },
  {
    label: "Other",
    icons: ["box", "package", "shopping-bag", "gift", "key", "lock", "star", "heart", "briefcase", "music", "palette", "camera"],
  },
];
