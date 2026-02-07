# dashWorth

## About
dashWorth is a privacy-first net worth tracker. All data stays in the user's browser (IndexedDB). No backend, no registration, no data leaving the device.

**Domain:** dashworth.net
**Tagline:** "Your wealth. Your data. Your dashboard."

## Tech Stack
- Next.js 15 (App Router), React 19, TypeScript (strict mode)
- Tailwind CSS 4 for styling
- Dexie.js for IndexedDB storage (all data client-side)
- Recharts for charts and graphs
- Lucide React for icons
- No backend, no API routes, no server state

## Architecture

### Core Principles
- Everything runs client-side ("use client" on all interactive components)
- No API routes, no server state, no external databases
- Data persists in IndexedDB via Dexie.js
- JSON export/import for backup and device transfer
- PWA-ready (installable, offline-capable)

### Data Flow
1. User adds/edits assets → saved to IndexedDB
2. User takes snapshot → current asset values frozen to a point-in-time record
3. Dashboard reads snapshots → renders charts and stats
4. Export → IndexedDB data serialized to JSON file
5. Import → JSON file parsed and written to IndexedDB

### Key Data Entities
- **Asset** — a single thing of value (e.g. "Bitcoin — Trezor", "Apartment Prague 6")
- **Category** — top-level grouping for assets (e.g. "Crypto", "Real Estate")
- **Group** — optional sub-group within a category (e.g. "Bitcoin", "US Tech"). Assets on the Assets page are displayed grouped by category → group. AllocationPie supports toggling between category and group views.
- **Snapshot** — point-in-time record of all asset values (entries include denormalized group field)
- See `/docs/data-model.md` for full schema

### File Structure
```
src/
├── app/                  # Next.js App Router pages
│   ├── layout.tsx        # Root layout with sidebar/navigation
│   ├── page.tsx          # Dashboard (main page)
│   ├── assets/           # Asset management page
│   ├── snapshots/        # Snapshot history page
│   └── settings/         # Settings page (export/import, preferences)
├── components/
│   ├── layout/           # Sidebar, BottomNav, Header
│   ├── assets/           # AssetList, AssetForm, AssetCard
│   ├── dashboard/        # NetWorthChart, AllocationPie, Movers
│   ├── snapshots/        # SnapshotList, SnapshotDetail
│   └── ui/               # Shared UI components (Button, Modal, Card)
├── hooks/                # Custom React hooks (useAssets, useSnapshots, etc.)
├── lib/
│   ├── db.ts             # Dexie database instance and schema
│   ├── export.ts         # JSON/CSV export logic
│   ├── import.ts         # JSON import logic
│   ├── currencies.ts     # Currency conversion utilities
│   └── utils.ts          # General utilities
├── types/
│   └── index.ts          # TypeScript type definitions
└── constants/
    └── categories.ts     # Default categories with icons and colors
```

## Conventions

### Code Style
- Components: PascalCase, one file per component
- Hooks: `src/hooks/useXxx.ts`
- Utilities: `src/lib/`
- Types: `src/types/`
- Constants: `src/constants/`
- All code and variable names in English
- Comments can be in Czech or English

### Component Patterns
- Use functional components with hooks
- Use Dexie React hooks (`useLiveQuery`) for reactive data from IndexedDB
- Prefer small, focused components over large monoliths
- Colocate component-specific types within the component file if small, otherwise in `src/types/`

### Styling
- Use Tailwind CSS utility classes exclusively
- No custom CSS files unless absolutely necessary
- Follow mobile-first responsive design (sm → md → lg breakpoints)
- Dark mode as default, support light mode via `dark:` classes

## Design Guidelines

### Visual Style
- Dark mode as default, light mode as secondary option
- Minimalist, clean dashboard aesthetic
- Emerald/green as primary accent color (`emerald-500`, `emerald-600`)
- Neutral grays for backgrounds and borders (`zinc-800`, `zinc-900` for dark mode)
- Clean typography, good spacing, no clutter

### Layout
- Desktop: Sidebar navigation (left) + main content area
- Mobile: Bottom tab bar navigation + full-width content
- Breakpoint: sidebar visible from `md` (768px) up

### UX Principles
- Zero-friction onboarding — no registration, start adding assets immediately
- Clear visual hierarchy — net worth number is the hero
- Confirm before destructive actions (delete asset, delete snapshot)
- Toast notifications for success/error feedback
- Empty states with helpful guidance (not just "no data")

## Currency
- Support CZK, EUR, USD as base currencies
- User picks their primary display currency in settings
- Assets can be in any currency, converted for display
- Exchange rates can be fetched client-side or manually set

## Important Notes
- NEVER add API routes or server-side data fetching for user data
- NEVER send user data to any external service without explicit user action (export)
- All data operations must work offline
- Keep bundle size small — lazy load heavy components (charts)
- Test responsive design at 375px (mobile) and 1280px (desktop)


<claude-mem-context>

</claude-mem-context>