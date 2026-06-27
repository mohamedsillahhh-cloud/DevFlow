# Architecture

## Overview

DevFlow is a single-page application (SPA) built with React 19, TypeScript, and Vite. It uses Dexie.js (IndexedDB) as its local-first database, requiring no external backend or server.

## Component Architecture

```
App
├── Router (React Router v7)
│   └── AppLayout (nested layout)
│       ├── Sidebar (navigation)
│       ├── Header (title, theme toggle, user info)
│       └── <Outlet /> (page content)
│           ├── DashboardPage
│           ├── FinancePage
│           ├── ProjectsPage
│           ├── InvestmentsPage
│           ├── TimerPage
│           └── ConfigPage
```

### UI Component Tree

```
components/
├── ui/            Generic primitives
│   ├── panel.tsx        Card container with optional actions
│   ├── skeleton.tsx     Loading skeleton
│   ├── stat-card.tsx    KPI display card
│   ├── status-badge.tsx Project status indicator
│   ├── pagination.tsx   Page navigation
│   ├── notice-banner.tsx
│   └── alert-banner.tsx
├── charts/        Data visualization
│   ├── data-viz.tsx     Area, Bar, Donut, Pie charts (Recharts)
│   └── rate-card.tsx
├── layout/        App shell
│   ├── app-layout.tsx   Main layout with sidebar + header
│   └── page-section-nav.tsx
└── shared/        Feature-agnostic components
    ├── error-boundary.tsx
    ├── empty-state.tsx
    ├── full-screen-loader.tsx
    ├── export-dropdown.tsx
    └── month-year-picker.tsx
```

### Data Layer

```
hooks/
└── use-data.ts       useAsyncData (fetch + reload) + useLiveQuery (reactive subscriptions)

lib/
├── data/
│   ├── db.ts          Dexie database class with 9 tables
│   └── index.ts       CRUD operations, snapshot queries, relation resolvers
├── format/            Formatting utilities
│   ├── currency.ts
│   ├── date.ts
│   └── project.ts
├── export/            Export generators
│   ├── csv.ts
│   ├── excel.ts
│   └── pdf.ts
├── types.ts           Shared TypeScript interfaces
├── schemas.ts         Zod validation schemas
├── cn.ts              Class name utility
└── navigation.ts      Route helpers
```

## Data Flow

1. Pages use `useAsyncData` to fetch initial data on mount (wraps Dexie queries)
2. `useLiveQuery` provides reactive subscriptions — UI updates automatically when IndexedDB data changes
3. User actions call CRUD functions in `lib/data/index.ts`
4. After mutations, `reload()` can be called to refresh a snapshot, or `useLiveQuery` handles it automatically
5. Charts and derived data are computed client-side from snapshots

## Routing

- React Router v7 with nested layout via `<Outlet />`
- Routes are defined in `App.tsx` with `AppLayout` as the parent
- Page sections are handled via URL path segments (e.g., `/financas/lancamentos`)
- `getWorkspaceSection()` extracts the current section from the pathname

## Theming

- CSS custom properties in `index.css` for all colors
- `data-theme` attribute on `<html>` toggles between `dark` and `light`
- Theme preference stored in both IndexedDB (config) and localStorage
- Smooth transitions via `transition` on CSS variables
