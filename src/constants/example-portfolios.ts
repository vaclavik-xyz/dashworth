export interface ExampleAsset {
  name: string;
  percentage: number;
  category: string;
  group?: string;
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
}

export const EXAMPLE_PORTFOLIOS: ExamplePortfolio[] = [
  /* ── Elon Musk ───────────────────────────────────────── */
  {
    id: "elon-musk",
    name: "Elon Musk",
    initials: "EM",
    color: "bg-blue-600",
    accentHex: "#2563eb",
    description: "CEO of Tesla & SpaceX, owner of X, founder of xAI and Neuralink",
    categories: [
      { name: "Public Companies", icon: "trending-up", color: "emerald" },
      { name: "Private Ventures", icon: "briefcase", color: "blue" },
      { name: "Cash & Savings", icon: "banknote", color: "yellow" },
    ],
    snapshots: [
      {
        year: 2012,
        totalUsd: 2_000_000_000,
        label: "Tesla IPO",
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
        label: "Tesla stock options",
        assets: [
          { name: "Tesla", percentage: 55, category: "Public Companies" },
          { name: "SpaceX", percentage: 35, category: "Private Ventures", group: "Space & AI" },
          { name: "Boring Company", percentage: 3, category: "Private Ventures", group: "Infrastructure" },
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
        label: "Acquires Twitter",
        assets: [
          { name: "Tesla", percentage: 50, category: "Public Companies" },
          { name: "SpaceX", percentage: 25, category: "Private Ventures", group: "Space & AI" },
          { name: "Twitter/X", percentage: 15, category: "Private Ventures", group: "Infrastructure" },
          { name: "Other ventures", percentage: 8, category: "Private Ventures" },
          { name: "Cash", percentage: 2, category: "Cash & Savings" },
        ],
      },
      {
        year: 2024,
        totalUsd: 400_000_000_000,
        label: "xAI launch, Trump era",
        assets: [
          { name: "Tesla", percentage: 45, category: "Public Companies" },
          { name: "SpaceX", percentage: 30, category: "Private Ventures", group: "Space & AI" },
          { name: "xAI", percentage: 10, category: "Private Ventures", group: "Space & AI" },
          { name: "X", percentage: 5, category: "Private Ventures", group: "Infrastructure" },
          { name: "Neuralink", percentage: 3, category: "Private Ventures", group: "Space & AI" },
          { name: "Boring Company", percentage: 2, category: "Private Ventures", group: "Infrastructure" },
          { name: "Cash", percentage: 5, category: "Cash & Savings" },
        ],
      },
      {
        year: 2025,
        totalUsd: 750_000_000_000,
        label: "SpaceX-xAI merger, $750B",
        assets: [
          { name: "SpaceX / xAI", percentage: 45, category: "Private Ventures", group: "Space & AI" },
          { name: "Tesla", percentage: 37, category: "Public Companies" },
          { name: "X", percentage: 5, category: "Private Ventures", group: "Infrastructure" },
          { name: "Neuralink", percentage: 3, category: "Private Ventures", group: "Space & AI" },
          { name: "Boring Company", percentage: 2, category: "Private Ventures", group: "Infrastructure" },
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
    color: "bg-amber-600",
    accentHex: "#d97706",
    description: "CEO of Berkshire Hathaway, legendary value investor. Donated over $60B to charity.",
    categories: [
      { name: "Berkshire Hathaway", icon: "building-2", color: "purple" },
      { name: "Personal Investments", icon: "piggy-bank", color: "emerald" },
      { name: "Real Estate", icon: "home", color: "amber" },
      { name: "Cash & Savings", icon: "banknote", color: "yellow" },
    ],
    snapshots: [
      {
        year: 2000,
        totalUsd: 36_000_000_000,
        label: "Dot-com recovery",
        assets: [
          { name: "Berkshire Hathaway", percentage: 99, category: "Berkshire Hathaway" },
          { name: "Omaha home", percentage: 0.5, category: "Real Estate" },
          { name: "Cash", percentage: 0.5, category: "Cash & Savings" },
        ],
      },
      {
        year: 2005,
        totalUsd: 44_000_000_000,
        label: "Pre-crash peak",
        assets: [
          { name: "Berkshire Hathaway", percentage: 99, category: "Berkshire Hathaway" },
          { name: "Omaha home", percentage: 0.5, category: "Real Estate" },
          { name: "Cash", percentage: 0.5, category: "Cash & Savings" },
        ],
      },
      {
        year: 2008,
        totalUsd: 62_000_000_000,
        label: "Post-crash recovery",
        assets: [
          { name: "Berkshire Hathaway", percentage: 99, category: "Berkshire Hathaway" },
          { name: "Other investments", percentage: 1, category: "Personal Investments" },
        ],
      },
      {
        year: 2010,
        totalUsd: 47_000_000_000,
        label: "Berkshire rebounds",
        assets: [
          { name: "Berkshire Hathaway", percentage: 99.5, category: "Berkshire Hathaway" },
          { name: "Other investments", percentage: 0.5, category: "Personal Investments" },
        ],
      },
      {
        year: 2015,
        totalUsd: 73_000_000_000,
        label: "Apple investment begins",
        assets: [
          { name: "Berkshire Hathaway", percentage: 99.5, category: "Berkshire Hathaway" },
          { name: "Other investments", percentage: 0.5, category: "Personal Investments" },
        ],
      },
      {
        year: 2020,
        totalUsd: 68_000_000_000,
        label: "COVID impact",
        assets: [
          { name: "Berkshire Hathaway", percentage: 99.5, category: "Berkshire Hathaway" },
          { name: "Other investments", percentage: 0.5, category: "Personal Investments" },
        ],
      },
      {
        year: 2024,
        totalUsd: 138_000_000_000,
        label: "Record profits, $138B",
        assets: [
          { name: "Berkshire Hathaway", percentage: 99.5, category: "Berkshire Hathaway" },
          { name: "Other investments", percentage: 0.5, category: "Personal Investments" },
        ],
      },
      {
        year: 2025,
        totalUsd: 150_000_000_000,
        label: "Retirement, $150B",
        assets: [
          { name: "Berkshire Hathaway", percentage: 99.5, category: "Berkshire Hathaway" },
          { name: "Other investments", percentage: 0.5, category: "Personal Investments" },
        ],
      },
    ],
  },

  /* ── Dr. Dre ─────────────────────────────────────────── */
  {
    id: "dr-dre",
    name: "Dr. Dre",
    initials: "DD",
    color: "bg-red-600",
    accentHex: "#dc2626",
    description: "Hip-hop legend, producer, co-founder of Beats Electronics (acquired by Apple for $3B)",
    categories: [
      { name: "Music & Entertainment", icon: "music", color: "purple" },
      { name: "Investments", icon: "trending-up", color: "emerald" },
      { name: "Real Estate", icon: "home", color: "amber" },
      { name: "Cash & Savings", icon: "banknote", color: "yellow" },
    ],
    snapshots: [
      {
        year: 2005,
        totalUsd: 80_000_000,
        label: "Aftermath golden era",
        assets: [
          { name: "Aftermath Records", percentage: 50, category: "Music & Entertainment", group: "Music Income" },
          { name: "Music royalties", percentage: 25, category: "Music & Entertainment", group: "Music Income" },
          { name: "Real Estate", percentage: 15, category: "Real Estate" },
          { name: "Cash", percentage: 10, category: "Cash & Savings" },
        ],
      },
      {
        year: 2008,
        totalUsd: 150_000_000,
        label: "Beats Electronics founded",
        assets: [
          { name: "Aftermath Records", percentage: 30, category: "Music & Entertainment", group: "Music Income" },
          { name: "Beats Electronics", percentage: 25, category: "Investments" },
          { name: "Music royalties", percentage: 20, category: "Music & Entertainment", group: "Music Income" },
          { name: "Real Estate", percentage: 15, category: "Real Estate" },
          { name: "Cash", percentage: 10, category: "Cash & Savings" },
        ],
      },
      {
        year: 2012,
        totalUsd: 250_000_000,
        label: "Beats growing",
        assets: [
          { name: "Beats Electronics", percentage: 40, category: "Investments" },
          { name: "Aftermath Records", percentage: 20, category: "Music & Entertainment", group: "Music Income" },
          { name: "Music royalties", percentage: 15, category: "Music & Entertainment", group: "Music Income" },
          { name: "Real Estate", percentage: 15, category: "Real Estate" },
          { name: "Cash", percentage: 10, category: "Cash & Savings" },
        ],
      },
      {
        year: 2014,
        totalUsd: 800_000_000,
        label: "Apple acquires Beats \u2014 $3B deal",
        assets: [
          { name: "Apple/Beats payout", percentage: 70, category: "Investments", group: "Post-Beats Portfolio" },
          { name: "Aftermath Records", percentage: 8, category: "Music & Entertainment", group: "Music Income" },
          { name: "Music royalties", percentage: 7, category: "Music & Entertainment", group: "Music Income" },
          { name: "Real Estate", percentage: 10, category: "Real Estate" },
          { name: "Cash", percentage: 5, category: "Cash & Savings" },
        ],
      },
      {
        year: 2016,
        totalUsd: 740_000_000,
        label: "Post-deal taxes",
        assets: [
          { name: "Apple stock/cash", percentage: 60, category: "Investments", group: "Post-Beats Portfolio" },
          { name: "Aftermath Records", percentage: 8, category: "Music & Entertainment", group: "Music Income" },
          { name: "Music royalties", percentage: 7, category: "Music & Entertainment", group: "Music Income" },
          { name: "Real Estate", percentage: 15, category: "Real Estate" },
          { name: "Cash", percentage: 10, category: "Cash & Savings" },
        ],
      },
      {
        year: 2020,
        totalUsd: 820_000_000,
        label: "Peak wealth",
        assets: [
          { name: "Investments", percentage: 55, category: "Investments", group: "Post-Beats Portfolio" },
          { name: "Real Estate", percentage: 20, category: "Real Estate" },
          { name: "Music royalties", percentage: 10, category: "Music & Entertainment", group: "Music Income" },
          { name: "Production", percentage: 10, category: "Music & Entertainment", group: "Music Income" },
          { name: "Cash", percentage: 5, category: "Cash & Savings" },
        ],
      },
      {
        year: 2022,
        totalUsd: 500_000_000,
        label: "Divorce settlement -$100M+",
        assets: [
          { name: "Investments", percentage: 45, category: "Investments", group: "Post-Beats Portfolio" },
          { name: "Real Estate", percentage: 20, category: "Real Estate" },
          { name: "Music royalties", percentage: 15, category: "Music & Entertainment", group: "Music Income" },
          { name: "Production", percentage: 10, category: "Music & Entertainment", group: "Music Income" },
          { name: "Cash", percentage: 10, category: "Cash & Savings" },
        ],
      },
      {
        year: 2025,
        totalUsd: 500_000_000,
        label: "Stabilization",
        assets: [
          { name: "Investments", percentage: 45, category: "Investments", group: "Post-Beats Portfolio" },
          { name: "Real Estate", percentage: 20, category: "Real Estate" },
          { name: "Music royalties", percentage: 15, category: "Music & Entertainment", group: "Music Income" },
          { name: "Production", percentage: 10, category: "Music & Entertainment", group: "Music Income" },
          { name: "Cash", percentage: 10, category: "Cash & Savings" },
        ],
      },
    ],
  },

  /* ── LeBron James ────────────────────────────────────── */
  {
    id: "lebron-james",
    name: "LeBron James",
    initials: "LJ",
    color: "bg-purple-600",
    accentHex: "#9333ea",
    description: "NBA legend, first active player to become a billionaire. Nike lifetime deal worth $1B+.",
    categories: [
      { name: "NBA Earnings", icon: "trophy", color: "orange" },
      { name: "Endorsements", icon: "star", color: "yellow" },
      { name: "Business & Equity", icon: "briefcase", color: "blue" },
      { name: "Real Estate", icon: "home", color: "amber" },
      { name: "Cash & Savings", icon: "banknote", color: "emerald" },
    ],
    snapshots: [
      {
        year: 2006,
        totalUsd: 60_000_000,
        label: "Early NBA career",
        assets: [
          { name: "NBA contracts", percentage: 40, category: "NBA Earnings" },
          { name: "Nike endorsement", percentage: 30, category: "Endorsements" },
          { name: "Other endorsements", percentage: 15, category: "Endorsements" },
          { name: "Cash", percentage: 15, category: "Cash & Savings" },
        ],
      },
      {
        year: 2010,
        totalUsd: 120_000_000,
        label: "The Decision \u2014 Miami Heat",
        assets: [
          { name: "NBA contracts", percentage: 35, category: "NBA Earnings" },
          { name: "Nike endorsement", percentage: 30, category: "Endorsements" },
          { name: "Other endorsements", percentage: 15, category: "Endorsements" },
          { name: "Fenway Sports Group", percentage: 5, category: "Business & Equity", group: "Sports Investments" },
          { name: "Cash", percentage: 15, category: "Cash & Savings" },
        ],
      },
      {
        year: 2014,
        totalUsd: 200_000_000,
        label: "Beats payout, back to Cleveland",
        assets: [
          { name: "NBA contracts", percentage: 30, category: "NBA Earnings" },
          { name: "Nike deal", percentage: 30, category: "Endorsements" },
          { name: "Other endorsements", percentage: 10, category: "Endorsements" },
          { name: "Fenway Sports Group", percentage: 8, category: "Business & Equity", group: "Sports Investments" },
          { name: "Beats payout", percentage: 5, category: "Business & Equity" },
          { name: "Real Estate", percentage: 10, category: "Real Estate" },
          { name: "Cash", percentage: 7, category: "Cash & Savings" },
        ],
      },
      {
        year: 2016,
        totalUsd: 400_000_000,
        label: "Nike lifetime $1B deal",
        assets: [
          { name: "Nike lifetime deal", percentage: 30, category: "Endorsements" },
          { name: "NBA contracts", percentage: 25, category: "NBA Earnings" },
          { name: "SpringHill", percentage: 10, category: "Business & Equity", group: "Media Empire" },
          { name: "Fenway Sports Group", percentage: 10, category: "Business & Equity", group: "Sports Investments" },
          { name: "Other endorsements", percentage: 10, category: "Endorsements" },
          { name: "Real Estate", percentage: 10, category: "Real Estate" },
          { name: "Cash", percentage: 5, category: "Cash & Savings" },
        ],
      },
      {
        year: 2020,
        totalUsd: 500_000_000,
        label: "SpringHill, Lakers championship",
        assets: [
          { name: "Nike lifetime deal", percentage: 25, category: "Endorsements" },
          { name: "NBA salary", percentage: 20, category: "NBA Earnings" },
          { name: "SpringHill", percentage: 15, category: "Business & Equity", group: "Media Empire" },
          { name: "Fenway Sports Group", percentage: 15, category: "Business & Equity", group: "Sports Investments" },
          { name: "Other endorsements", percentage: 10, category: "Endorsements" },
          { name: "Real Estate", percentage: 10, category: "Real Estate" },
          { name: "Cash", percentage: 5, category: "Cash & Savings" },
        ],
      },
      {
        year: 2022,
        totalUsd: 1_000_000_000,
        label: "First active NBA billionaire",
        assets: [
          { name: "Nike lifetime deal", percentage: 30, category: "Endorsements" },
          { name: "SpringHill Company", percentage: 15, category: "Business & Equity", group: "Media Empire" },
          { name: "Fenway Sports Group", percentage: 15, category: "Business & Equity", group: "Sports Investments" },
          { name: "NBA salary", percentage: 15, category: "NBA Earnings" },
          { name: "Other endorsements", percentage: 10, category: "Endorsements" },
          { name: "Real Estate", percentage: 10, category: "Real Estate" },
          { name: "Cash", percentage: 5, category: "Cash & Savings" },
        ],
      },
      {
        year: 2025,
        totalUsd: 1_200_000_000,
        label: "Legacy portfolio, $1.2B",
        assets: [
          { name: "Nike lifetime deal", percentage: 28, category: "Endorsements" },
          { name: "SpringHill", percentage: 15, category: "Business & Equity", group: "Media Empire" },
          { name: "Fenway Sports Group", percentage: 15, category: "Business & Equity", group: "Sports Investments" },
          { name: "NBA salary", percentage: 12, category: "NBA Earnings" },
          { name: "Other endorsements", percentage: 10, category: "Endorsements" },
          { name: "Real Estate", percentage: 10, category: "Real Estate" },
          { name: "Blaze Pizza & investments", percentage: 5, category: "Business & Equity" },
          { name: "Cash", percentage: 5, category: "Cash & Savings" },
        ],
      },
    ],
  },

  /* ── Daniel Křetínský ────────────────────────────────── */
  {
    id: "daniel-kretinsky",
    name: "Daniel K\u0159et\u00ednsk\u00fd",
    initials: "DK",
    color: "bg-emerald-600",
    accentHex: "#059669",
    description: "Czech billionaire, \"Czech Sphinx\". Founder of EPH, owner of West Ham, Sparta Praha, Royal Mail.",
    categories: [
      { name: "Energy", icon: "landmark", color: "yellow" },
      { name: "Retail & Industry", icon: "shopping-bag", color: "blue" },
      { name: "Media", icon: "globe", color: "purple" },
      { name: "Sports", icon: "trophy", color: "emerald" },
      { name: "Real Estate", icon: "home", color: "amber" },
      { name: "Cash & Savings", icon: "banknote", color: "zinc" },
    ],
    snapshots: [
      {
        year: 2012,
        totalUsd: 1_500_000_000,
        label: "EPH early days",
        assets: [
          { name: "EPH", percentage: 80, category: "Energy" },
          { name: "Real Estate", percentage: 10, category: "Real Estate" },
          { name: "Sparta Praha", percentage: 5, category: "Sports", group: "Football" },
          { name: "Cash", percentage: 5, category: "Cash & Savings" },
        ],
      },
      {
        year: 2015,
        totalUsd: 3_000_000_000,
        label: "EPH expansion, Heath Hall",
        assets: [
          { name: "EPH", percentage: 70, category: "Energy" },
          { name: "Heath Hall & properties", percentage: 12, category: "Real Estate" },
          { name: "Czech News Center", percentage: 5, category: "Media" },
          { name: "Sparta Praha", percentage: 3, category: "Sports", group: "Football" },
          { name: "Cash", percentage: 10, category: "Cash & Savings" },
        ],
      },
      {
        year: 2018,
        totalUsd: 4_000_000_000,
        label: "Le Monde, media expansion",
        assets: [
          { name: "EPH", percentage: 65, category: "Energy" },
          { name: "Real Estate", percentage: 12, category: "Real Estate" },
          { name: "Czech News Center", percentage: 5, category: "Media" },
          { name: "Le Monde stake", percentage: 3, category: "Media" },
          { name: "Sparta Praha", percentage: 3, category: "Sports", group: "Football" },
          { name: "Cash", percentage: 12, category: "Cash & Savings" },
        ],
      },
      {
        year: 2020,
        totalUsd: 5_000_000_000,
        label: "COVID buys: Sainsbury, Foot Locker",
        assets: [
          { name: "EPH", percentage: 55, category: "Energy" },
          { name: "Sainsbury", percentage: 10, category: "Retail & Industry", group: "UK Investments" },
          { name: "Foot Locker", percentage: 5, category: "Retail & Industry" },
          { name: "Real Estate", percentage: 10, category: "Real Estate" },
          { name: "Czech News Center", percentage: 5, category: "Media" },
          { name: "Le Monde stake", percentage: 3, category: "Media" },
          { name: "West Ham", percentage: 5, category: "Sports", group: "Football" },
          { name: "Sparta Praha", percentage: 2, category: "Sports", group: "Football" },
          { name: "Cash", percentage: 5, category: "Cash & Savings" },
        ],
      },
      {
        year: 2022,
        totalUsd: 7_000_000_000,
        label: "Royal Mail, energy crisis profits",
        assets: [
          { name: "EPH", percentage: 50, category: "Energy" },
          { name: "Royal Mail", percentage: 8, category: "Retail & Industry", group: "UK Investments" },
          { name: "Sainsbury", percentage: 5, category: "Retail & Industry", group: "UK Investments" },
          { name: "Metro", percentage: 5, category: "Retail & Industry", group: "German Investments" },
          { name: "Real Estate", percentage: 10, category: "Real Estate" },
          { name: "Czech News Center", percentage: 4, category: "Media" },
          { name: "Le Monde stake", percentage: 3, category: "Media" },
          { name: "West Ham", percentage: 5, category: "Sports", group: "Football" },
          { name: "Sparta Praha", percentage: 2, category: "Sports", group: "Football" },
          { name: "Cash", percentage: 8, category: "Cash & Savings" },
        ],
      },
      {
        year: 2024,
        totalUsd: 9_000_000_000,
        label: "ThyssenKrupp, Metro",
        assets: [
          { name: "EPH", percentage: 50, category: "Energy" },
          { name: "Royal Mail", percentage: 8, category: "Retail & Industry", group: "UK Investments" },
          { name: "Sainsbury", percentage: 5, category: "Retail & Industry", group: "UK Investments" },
          { name: "Metro", percentage: 5, category: "Retail & Industry", group: "German Investments" },
          { name: "ThyssenKrupp Steel", percentage: 5, category: "Retail & Industry", group: "German Investments" },
          { name: "Real Estate", percentage: 10, category: "Real Estate" },
          { name: "Czech News Center", percentage: 3, category: "Media" },
          { name: "Le Monde stake", percentage: 3, category: "Media" },
          { name: "West Ham", percentage: 4, category: "Sports", group: "Football" },
          { name: "Sparta Praha", percentage: 2, category: "Sports", group: "Football" },
          { name: "Cash", percentage: 5, category: "Cash & Savings" },
        ],
      },
      {
        year: 2025,
        totalUsd: 10_000_000_000,
        label: "Czech Sphinx, $10B",
        assets: [
          { name: "EPH", percentage: 48, category: "Energy" },
          { name: "Royal Mail", percentage: 8, category: "Retail & Industry", group: "UK Investments" },
          { name: "Sainsbury", percentage: 4, category: "Retail & Industry", group: "UK Investments" },
          { name: "Metro", percentage: 5, category: "Retail & Industry", group: "German Investments" },
          { name: "ThyssenKrupp Steel", percentage: 5, category: "Retail & Industry", group: "German Investments" },
          { name: "Real Estate", percentage: 10, category: "Real Estate" },
          { name: "Czech News Center", percentage: 3, category: "Media" },
          { name: "Le Monde stake", percentage: 2, category: "Media" },
          { name: "West Ham", percentage: 4, category: "Sports", group: "Football" },
          { name: "Sparta Praha", percentage: 2, category: "Sports", group: "Football" },
          { name: "Cash", percentage: 9, category: "Cash & Savings" },
        ],
      },
    ],
  },
];
