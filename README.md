# Dashworth

**Your wealth. Your data. Your dashboard.**

Dashworth is a privacy-first net worth tracker that runs entirely in your browser. No accounts, no servers, no data leaving your device — everything is stored locally in IndexedDB.

## Features

- **Asset management** — track crypto, stocks, real estate, vehicles, cash, collectibles, domains, and more across custom categories
- **Snapshots** — capture your portfolio state over time and track net worth trends
- **Dashboard** — net worth chart, allocation pie, top assets, and recent activity at a glance
- **Auto price updates** — live prices for crypto (CoinGecko) and stocks (Yahoo Finance)
- **Multi-currency** — CZK, EUR, USD with automatic exchange rate conversion
- **6 themes** — Light, Dark, Midnight, Emerald Dark, System, and fully custom theme with color pickers
- **Snapshot reminders** — dashboard banner and nav badge when it's time to take a snapshot
- **Auto-snapshots** — daily or weekly automatic portfolio snapshots
- **PWA** — installable on mobile and desktop, works offline
- **Import / Export** — full JSON backup and restore
- **Privacy** — zero tracking, zero analytics, zero external data storage

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
├── app/                  # Next.js pages (dashboard, assets, snapshots, settings)
├── components/
│   ├── assets/           # Asset cards, forms
│   ├── dashboard/        # Net worth hero, charts, top assets, activity
│   ├── landing/          # Landing page for new users
│   ├── layout/           # AppShell, Sidebar, BottomNav, SnapshotReminder
│   ├── onboarding/       # First-run wizard
│   ├── settings/         # Category form
│   ├── snapshots/        # Snapshot cards, take snapshot form
│   └── ui/               # Button, Card, Modal, InstallPrompt
├── constants/            # Default categories, colors
├── hooks/                # useSnapshotOverdue
├── lib/                  # Database, utils, theme, exchange rates, price feeds
└── types/                # TypeScript interfaces
```

## How It Works

All data lives in your browser's IndexedDB via [Dexie.js](https://dexie.org/). There is no backend — the app is a static PWA served from a CDN. Price feeds are fetched client-side from public APIs (CoinGecko, Yahoo Finance via CORS proxy, exchangerate-api.com).

## Deployment

Dashworth is a static Next.js app. Deploy anywhere that supports Node.js or static export:

```bash
npm run build
```

The app is currently deployed at [dashworth.net](https://dashworth.net).

## License

MIT
