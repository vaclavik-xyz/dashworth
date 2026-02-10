# Dashworth

**Your wealth. Your data. Your dashboard.**

Dashworth is a privacy-first net worth tracker that runs entirely in your browser. No accounts, no servers, no data leaving your device — everything is stored locally in IndexedDB.

## Features

- **Asset management** — track crypto, stocks, real estate, vehicles, cash, collectibles, domains, and more across custom categories and groups
- **Auto-history** — automatic net worth tracking that records changes as you update assets
- **Dashboard** — net worth chart, allocation pie, top assets, and history log with net worth & changes tabs
- **Live prices** — crypto prices from CoinGecko, stock prices from Yahoo Finance, updated automatically on app start
- **Multi-currency** — CZK, EUR, USD with automatic exchange rate conversion
- **Privacy mode** — eye toggle to hide all financial values across the app
- **Collapsible categories & groups** — organize assets with pill badges showing counts and totals
- **Expandable asset cards** — inline quick-update for values without opening a form
- **5 themes** — Light, Dark, Midnight, Emerald Dark, System, plus a fully custom theme with color pickers
- **Landing page** — server-rendered for fast LCP, with interactive mockup carousel
- **Onboarding wizard** — 3-step setup: Currency → Assets → Review
- **PWA** — installable on mobile and desktop, works offline
- **Import / Export** — full JSON backup and restore (supports v1 and v2 formats)
- **Privacy** — zero tracking, zero analytics, zero external data storage

## Screenshots

<!-- TODO: Add screenshot of landing page -->
<!-- TODO: Add screenshot of dashboard -->
<!-- TODO: Add screenshot of assets page -->
<!-- TODO: Add screenshot of settings page -->

> **Tip:** Add screenshots to a `docs/` folder and reference them with relative paths, e.g. `![Dashboard](docs/dashboard.png)`.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Database | Dexie (IndexedDB) |
| Charts | Recharts |
| Icons | Lucide React |

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Production build
npm run build && npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                  # Next.js pages (dashboard, assets, settings)
├── components/
│   ├── assets/           # Asset cards, forms, detail panels
│   ├── dashboard/        # Net worth hero, charts, top assets, history log
│   ├── landing/          # HeroSection, FadeSection, FAQSection, CTASection, InstallProvider
│   ├── layout/           # AppShell, Sidebar, BottomNav
│   ├── onboarding/       # OnboardingWizard
│   ├── settings/         # CategoryForm
│   ├── shared/           # TickerInput, QuantityValueToggle, CollapsibleSection
│   └── ui/               # Button, Card, Modal, InstallPrompt, SlidePanel
├── constants/            # Default categories, colors
├── contexts/             # PrivacyContext
├── hooks/                # useAutoHistory, useContainerWidth
├── lib/                  # Database, utils, theme, exchange rates, price feeds, history
└── types/                # TypeScript interfaces
```

## How It Works

All data lives in your browser's IndexedDB via [Dexie.js](https://dexie.org/). There is no backend — the app is a static PWA served from a CDN. Price feeds are fetched client-side from public APIs (CoinGecko, Yahoo Finance via CORS proxy, exchangerate-api.com). Net worth history is recorded automatically as you add and update assets.

## Deployment

Dashworth is a static Next.js app. Deploy anywhere that supports Node.js or static export:

```bash
npm run build
```

The app is currently deployed at [dashworth.net](https://dashworth.net).

## License

BSL 1.1 (Business Source License)
