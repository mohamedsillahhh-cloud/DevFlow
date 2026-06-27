# Architecture

## Overview

DevFlow is a single-page application (SPA) built with React 19, TypeScript, and Vite. It uses Supabase as its backend-as-a-service, providing PostgreSQL, realtime subscriptions, and storage.

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
├── use-async-data.ts      Generic data fetching with AbortController
└── use-realtime-sync.ts   Realtime subscriptions + polling fallback

lib/
├── supabase/
│   ├── client.ts          Supabase client initialization
│   └── data.ts            CRUD operations
├── format/                Formatting utilities
│   ├── currency.ts
│   ├── date.ts
│   └── project.ts
├── export/                Export generators
│   ├── csv.ts
│   ├── excel.ts
│   └── pdf.ts
├── types.ts               Shared TypeScript interfaces
├── schemas.ts             Zod validation schemas
├── cn.ts                  Class name utility
└── navigation.ts          Route helpers
```

## Data Flow

1. Pages use `useAsyncData` to fetch initial data on mount
2. `useRealtimeSync` subscribes to Supabase channel changes + polling
3. User actions call CRUD functions in `lib/supabase/data.ts`
4. After mutations, `reload()` is called to refresh the snapshot
5. Charts and derived data are computed client-side from snapshots

## Routing

- React Router v7 with nested layout via `<Outlet />`
- Routes are defined in `App.tsx` with `AppLayout` as the parent
- Page sections are handled via URL path segments (e.g., `/financas/lancamentos`)
- `getWorkspaceSection()` extracts the current section from the pathname

## Theming

- CSS custom properties in `index.css` for all colors
- `data-theme` attribute on `<html>` toggles between `dark` and `light`
- Theme preference stored in both Supabase config and localStorage
- Smooth transitions via `transition` on CSS variables
