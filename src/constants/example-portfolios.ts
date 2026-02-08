export interface ExampleAsset {
  name: string;
  percentage: number;
  category: string;
  group?: string;
  /** Auto-fetch price source (defaults to "manual" if omitted) */
  priceSource?: "coingecko" | "yahoo";
  /** Ticker / CoinGecko ID for auto-fetch */
  ticker?: string;
  /** Number of units held (e.g. BTC count, share count) */
  quantity?: number;
}

export interface ExampleCategory {
  name: string;
  icon: string;
  color: string;
}

export interface ExampleSnapshot {
  year: number;
  totalUsd: number;
  label: string;
  assets: ExampleAsset[];
}

export interface ExamplePortfolio {
  id: string;
  name: string;
  initials: string;
  color: string; // tailwind bg class
  accentHex: string;
  description: string;
  categories: ExampleCategory[];
  snapshots: ExampleSnapshot[];
  /** When true, shows "Live prices" badge on the examples page */
  livePrices?: boolean;
}

export const EXAMPLE_PORTFOLIOS: ExamplePortfolio[] = [
  /* ── Elon Musk ───────────────────────────────────────── */
  {
    id: "elon-musk",
    name: "Elon Musk",
    initials: "EM",
    color: "bg-emerald-600",
    accentHex: "#10b981",
    description: "CEO of Tesla & SpaceX, owner of X, founder of xAI and Neuralink",
    livePrices: true,
    categories: [
      { name: "Public Companies", icon: "trending-up", color: "emerald" },
      { name: "Private Ventures", icon: "briefcase", color: "blue" },
      { name: "Cash & Savings", icon: "banknote", color: "yellow" },
    ],
    snapshots: [
      {
        year: 2012,
        totalUsd: 2_000_000_000,
        label: "Tesla IPO era",
        assets: [
          { name: "SpaceX", percentage: 50, category: "Private Ventures", group: "Space & AI" },
          { name: "Tesla", percentage: 40, category: "Public Companies" },
          { name: "Cash", percentage: 10, category: "Cash & Savings" },
        ],
      },
      {
        year: 2015,
        totalUsd: 13_000_000_000,
        label: "SolarCity era",
        assets: [
          { name: "Tesla", percentage: 50, category: "Public Companies" },
          { name: "SpaceX", percentage: 40, category: "Private Ventures", group: "Space & AI" },
          { name: "SolarCity", percentage: 5, category: "Public Companies" },
          { name: "Cash", percentage: 5, category: "Cash & Savings" },
        ],
      },
      {
        year: 2018,
        totalUsd: 20_000_000_000,
        label: "Tesla stock options battle",
        assets: [
          { name: "Tesla", percentage: 55, category: "Public Companies" },
          { name: "SpaceX", percentage: 35, category: "Private Ventures", group: "Space & AI" },
          { name: "Boring Company", percentage: 3, category: "Private Ventures", group: "Other Ventures" },
          { name: "Neuralink", percentage: 2, category: "Private Ventures", group: "Space & AI" },
          { name: "Cash", percentage: 5, category: "Cash & Savings" },
        ],
      },
      {
        year: 2020,
        totalUsd: 155_000_000_000,
        label: "Tesla joins S&P 500",
        assets: [
          { name: "Tesla", percentage: 75, category: "Public Companies" },
          { name: "SpaceX", percentage: 20, category: "Private Ventures", group: "Space & AI" },
          { name: "Other ventures", percentage: 3, category: "Private Ventures" },
          { name: "Cash", percentage: 2, category: "Cash & Savings" },
        ],
      },
      {
        year: 2021,
        totalUsd: 300_000_000_000,
        label: "World's richest person",
        assets: [
          { name: "Tesla", percentage: 70, category: "Public Companies" },
          { name: "SpaceX", percentage: 20, category: "Private Ventures", group: "Space & AI" },
          { name: "Other ventures", percentage: 8, category: "Private Ventures" },
          { name: "Cash", percentage: 2, category: "Cash & Savings" },
        ],
      },
      {
        year: 2022,
        totalUsd: 140_000_000_000,
        label: "Acquires Twitter for $44B",
        assets: [
          { name: "Tesla", percentage: 50, category: "Public Companies" },
          { name: "SpaceX", percentage: 25, category: "Private Ventures", group: "Space & AI" },
          { name: "X (Twitter)", percentage: 15, category: "Private Ventures", group: "Other Ventures" },
          { name: "Other ventures", percentage: 8, category: "Private Ventures" },
          { name: "Cash", percentage: 2, category: "Cash & Savings" },
        ],
      },
      {
        year: 2024,
        totalUsd: 400_000_000_000,
        label: "xAI launch, political era",
        assets: [
          { name: "Tesla", percentage: 45, category: "Public Companies" },
          { name: "SpaceX", percentage: 30, category: "Private Ventures", group: "Space & AI" },
          { name: "xAI", percentage: 10, category: "Private Ventures", group: "Space & AI" },
          { name: "X (Twitter)", percentage: 5, category: "Private Ventures", group: "Other Ventures" },
          { name: "Neuralink", percentage: 3, category: "Private Ventures", group: "Space & AI" },
          { name: "Boring Company", percentage: 2, category: "Private Ventures", group: "Other Ventures" },
          { name: "Cash", percentage: 5, category: "Cash & Savings" },
        ],
      },
      {
        year: 2025,
        totalUsd: 750_000_000_000,
        label: "SpaceX-xAI merger, $750B empire",
        assets: [
          { name: "SpaceX / xAI", percentage: 45, category: "Private Ventures", group: "Space & AI" },
          { name: "Tesla", percentage: 37, category: "Public Companies", priceSource: "yahoo", ticker: "TSLA", quantity: 730_000_000 },
          { name: "X (Twitter)", percentage: 5, category: "Private Ventures", group: "Other Ventures" },
          { name: "Neuralink", percentage: 3, category: "Private Ventures", group: "Space & AI" },
          { name: "Boring Company", percentage: 2, category: "Private Ventures", group: "Other Ventures" },
          { name: "Other", percentage: 3, category: "Private Ventures" },
          { name: "Cash", percentage: 5, category: "Cash & Savings" },
        ],
      },
    ],
  },

  /* ── Warren Buffett ──────────────────────────────────── */
  {
    id: "warren-buffett",
    name: "Warren Buffett",
    initials: "WB",
    color: "bg-purple-600",
    accentHex: "#8b5cf6",
    description: "The Oracle of Omaha. Greatest investor of all time. 99.5% in Berkshire Hathaway.",
    livePrices: true,
    categories: [
      { name: "Berkshire Hathaway", icon: "building-2", color: "purple" },
      { name: "Personal Investments", icon: "piggy-bank", color: "emerald" },
      { name: "Real Estate", icon: "home", color: "amber" },
    ],
    snapshots: [
      {
        year: 1990,
        totalUsd: 3_800_000_000,
        label: "Pre-internet, value investing discipline",
        assets: [
          { name: "Berkshire Hathaway", percentage: 99, category: "Berkshire Hathaway" },
          { name: "Omaha home", percentage: 0.5, category: "Real Estate" },
          { name: "Cash", percentage: 0.5, category: "Personal Investments" },
        ],
      },
      {
        year: 1995,
        totalUsd: 15_000_000_000,
        label: "Berkshire growing steadily",
        assets: [
          { name: "Berkshire Hathaway", percentage: 99, category: "Berkshire Hathaway" },
          { name: "Other", percentage: 1, category: "Personal Investments" },
        ],
      },
      {
        year: 2000,
        totalUsd: 36_000_000_000,
        label: "Avoided dot-com — mocked then vindicated",
        assets: [
          { name: "Berkshire Hathaway", percentage: 99, category: "Berkshire Hathaway" },
          { name: "Omaha home", percentage: 0.5, category: "Real Estate" },
          { name: "Cash", percentage: 0.5, category: "Personal Investments" },
        ],
      },
      {
        year: 2005,
        totalUsd: 44_000_000_000,
        label: "Steady compounding",
        assets: [
          { name: "Berkshire Hathaway", percentage: 99, category: "Berkshire Hathaway" },
          { name: "Other", percentage: 1, category: "Personal Investments" },
        ],
      },
      {
        year: 2008,
        totalUsd: 62_000_000_000,
        label: "'Be greedy when others are fearful'",
        assets: [
          { name: "Berkshire Hathaway", percentage: 99, category: "Berkshire Hathaway" },
          { name: "Other", percentage: 1, category: "Personal Investments" },
        ],
      },
      {
        year: 2010,
        totalUsd: 47_000_000_000,
        label: "Post-financial crisis recovery",
        assets: [
          { name: "Berkshire Hathaway", percentage: 99.5, category: "Berkshire Hathaway" },
          { name: "Other", percentage: 0.5, category: "Personal Investments" },
        ],
      },
      {
        year: 2015,
        totalUsd: 73_000_000_000,
        label: "Apple investment begins",
        assets: [
          { name: "Berkshire Hathaway", percentage: 99.5, category: "Berkshire Hathaway" },
          { name: "Other", percentage: 0.5, category: "Personal Investments" },
        ],
      },
      {
        year: 2018,
        totalUsd: 84_000_000_000,
        label: "Apple becomes largest holding",
        assets: [
          { name: "Berkshire Hathaway", percentage: 99.5, category: "Berkshire Hathaway" },
          { name: "Other", percentage: 0.5, category: "Personal Investments" },
        ],
      },
      {
        year: 2020,
        totalUsd: 68_000_000_000,
        label: "COVID impact, sells airlines",
        assets: [
          { name: "Berkshire Hathaway", percentage: 99.5, category: "Berkshire Hathaway" },
          { name: "Other", percentage: 0.5, category: "Personal Investments" },
        ],
      },
      {
        year: 2022,
        totalUsd: 108_000_000_000,
        label: "Record Berkshire profits",
        assets: [
          { name: "Berkshire Hathaway", percentage: 99.5, category: "Berkshire Hathaway" },
          { name: "Other", percentage: 0.5, category: "Personal Investments" },
        ],
      },
      {
        year: 2024,
        totalUsd: 138_000_000_000,
        label: "Record $42B operating profit",
        assets: [
          { name: "Berkshire Hathaway", percentage: 99.5, category: "Berkshire Hathaway" },
          { name: "Other", percentage: 0.5, category: "Personal Investments" },
        ],
      },
      {
        year: 2025,
        totalUsd: 150_000_000_000,
        label: "Retires as CEO. Donated $60B+ to charity.",
        assets: [
          { name: "Berkshire Hathaway (BRK-B)", percentage: 99.5, category: "Berkshire Hathaway", priceSource: "yahoo", ticker: "BRK-B", quantity: 309_538_500 },
          { name: "Non-Berkshire Portfolio", percentage: 0.33, category: "Personal Investments" },
          { name: "Omaha Home", percentage: 0.17, category: "Real Estate" },
        ],
      },
    ],
  },

  /* ── Michael Saylor ──────────────────────────────────── */
  {
    id: "michael-saylor",
    name: "Michael Saylor",
    initials: "MS",
    color: "bg-orange-600",
    accentHex: "#f97316",
    description: "Executive Chairman of Strategy (formerly MicroStrategy). Bitcoin maximalist.",
    livePrices: true,
    categories: [
      { name: "Bitcoin", icon: "bitcoin", color: "orange" },
      { name: "Public Equities", icon: "trending-up", color: "blue" },
      { name: "Real Estate", icon: "home", color: "amber" },
      { name: "Other", icon: "box", color: "zinc" },
    ],
    snapshots: [
      {
        year: 2000,
        totalUsd: 7_000_000_000,
        label: "Dot-com peak — MSTR at $333/share",
        assets: [
          { name: "MicroStrategy", percentage: 95, category: "Public Equities" },
          { name: "Real Estate", percentage: 3, category: "Real Estate" },
          { name: "Cash", percentage: 2, category: "Other" },
        ],
      },
      {
        year: 2002,
        totalUsd: 500_000_000,
        label: "SEC scandal, stock crashes 99%",
        assets: [
          { name: "MicroStrategy", percentage: 80, category: "Public Equities" },
          { name: "Real Estate", percentage: 15, category: "Real Estate" },
          { name: "Cash", percentage: 5, category: "Other" },
        ],
      },
      {
        year: 2010,
        totalUsd: 1_000_000_000,
        label: "Slow rebuild, enterprise software pivot",
        assets: [
          { name: "MicroStrategy", percentage: 75, category: "Public Equities" },
          { name: "Real Estate", percentage: 15, category: "Real Estate" },
          { name: "Patents & Other", percentage: 5, category: "Other" },
          { name: "Cash", percentage: 5, category: "Other" },
        ],
      },
      {
        year: 2015,
        totalUsd: 1_200_000_000,
        label: "Steady but unspectacular recovery",
        assets: [
          { name: "MicroStrategy", percentage: 70, category: "Public Equities" },
          { name: "Real Estate", percentage: 15, category: "Real Estate" },
          { name: "Other", percentage: 10, category: "Other" },
          { name: "Cash", percentage: 5, category: "Other" },
        ],
      },
      {
        year: 2019,
        totalUsd: 500_000_000,
        label: "Pre-Bitcoin era, MSTR stagnating",
        assets: [
          { name: "MicroStrategy", percentage: 70, category: "Public Equities" },
          { name: "Real Estate", percentage: 15, category: "Real Estate" },
          { name: "Other", percentage: 10, category: "Other" },
          { name: "Cash", percentage: 5, category: "Other" },
        ],
      },
      {
        year: 2020,
        totalUsd: 1_500_000_000,
        label: "The pivot: buys 17,732 BTC at $9,882 avg",
        assets: [
          { name: "MicroStrategy", percentage: 50, category: "Public Equities" },
          { name: "Bitcoin (Personal)", percentage: 30, category: "Bitcoin" },
          { name: "Real Estate", percentage: 10, category: "Real Estate" },
          { name: "Cash", percentage: 10, category: "Other" },
        ],
      },
      {
        year: 2021,
        totalUsd: 2_500_000_000,
        label: "BTC hits $69K, MSTR soars 5x",
        assets: [
          { name: "Strategy (MSTR)", percentage: 60, category: "Public Equities" },
          { name: "Bitcoin (Personal)", percentage: 25, category: "Bitcoin" },
          { name: "Real Estate", percentage: 10, category: "Real Estate" },
          { name: "Cash", percentage: 5, category: "Other" },
        ],
      },
      {
        year: 2022,
        totalUsd: 1_200_000_000,
        label: "Crypto winter. BTC drops to $16K. Diamond hands.",
        assets: [
          { name: "Strategy (MSTR)", percentage: 55, category: "Public Equities" },
          { name: "Bitcoin (Personal)", percentage: 25, category: "Bitcoin" },
          { name: "Real Estate", percentage: 12, category: "Real Estate" },
          { name: "Cash", percentage: 8, category: "Other" },
        ],
      },
      {
        year: 2024,
        totalUsd: 3_000_000_000,
        label: "BTC recovery, MSTR +300%",
        assets: [
          { name: "Strategy (MSTR)", percentage: 65, category: "Public Equities" },
          { name: "Bitcoin (Personal)", percentage: 20, category: "Bitcoin" },
          { name: "Real Estate", percentage: 10, category: "Real Estate" },
          { name: "Cash", percentage: 5, category: "Other" },
        ],
      },
      {
        year: 2025,
        totalUsd: 8_000_000_000,
        label: "BTC at $100K+. Strategy holds 500K+ BTC.",
        assets: [
          { name: "Strategy (MSTR)", percentage: 70, category: "Public Equities", priceSource: "yahoo", ticker: "MSTR", quantity: 19_998_580 },
          { name: "Bitcoin (Personal)", percentage: 20, category: "Bitcoin", priceSource: "coingecko", ticker: "bitcoin", quantity: 17_732 },
          { name: "Real Estate", percentage: 5, category: "Real Estate" },
          { name: "Patents & Other", percentage: 5, category: "Other" },
        ],
      },
    ],
  },
];
