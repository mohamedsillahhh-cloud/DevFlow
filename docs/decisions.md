# Architecture Decision Records

## ADR-001: Supabase as Backend

**Date:** 2026-06  
**Status:** Accepted  

### Context
The app needed a backend for persistent data storage, realtime updates, and potential user management.

### Decision
Use Supabase (PostgreSQL + Realtime + Auth) as the sole backend.

### Consequences
- No backend server to maintain
- Rapid development with built-in APIs
- Vendor lock-in to Supabase ecosystem
- Limited to PostgreSQL-compatible data models

---

## ADR-002: React Router v7 with Nested Layouts

**Date:** 2026-06  
**Status:** Accepted  

### Context
The app has multiple pages that share a common layout (sidebar, header).

### Decision
Use React Router v7 with a parent `AppLayout` component that wraps `<Outlet />` for child pages.

### Consequences
- Consistent navigation and header across all pages
- Shared state for mobile menu and theme
- Simple routing configuration in `App.tsx`

---

## ADR-003: CSS Custom Properties for Theming

**Date:** 2026-06  
**Status:** Accepted  

### Context
The app needs dark/light theme support with smooth transitions.

### Decision
Define all colors as CSS custom properties in `index.css` and toggle via `data-theme` attribute.

### Consequences
- Dynamic theming without runtime CSS-in-JS
- Smooth theme transitions via `transition` property
- Centralized color management
- No Tailwind dark: prefix duplication

---

## ADR-004: Polling + Realtime Hybrid

**Date:** 2026-06  
**Status:** Accepted  

### Context
Data needs to stay current across multiple devices/tabs.

### Decision
Use Supabase Realtime subscriptions with a polling fallback (`useRealtimeSync` hook).

### Consequences
- Instant updates when WebSocket is available
- Graceful degradation when realtime fails
- Configurable poll intervals per page
- Higher database read usage due to polling

---

## ADR-005: Auth Removal

**Date:** 2026-06  
**Status:** Accepted  

### Context
The authentication system added complexity for single-user and demo scenarios.

### Decision
Remove all auth code (login page, guards, auth context, session management).

### Consequences
- Simplified codebase (~500 lines removed)
- No login step for users
- Single-user model (multi-user requires re-adding auth)
- All Supabase tables need appropriate RLS for public access

---

## ADR-006: Single Data Snapshot Pattern

**Date:** 2026-06  
**Status:** Accepted  

### Context
Pages need multiple related data sets (projects, clients, config) and derived calculations.

### Decision
Each page fetches a single snapshot containing all its required data, then computes derived values client-side.

### Consequences
- One network request per page load
- All derived data computed consistently from the same snapshot
- Simple mental model: fetch → compute → render
- More processing on the client side
