# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Keyboard shortcuts hook (`useKeyboardShortcuts`, `useNavigationShortcuts`)
- EmptyState component with search/chart variants and SVG illustrations
- Reusable `@/*` path alias for cleaner imports
- Security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy)
- `.editorconfig`, `.prettierrc`, `.env.example` with documented variables
- `CONTRIBUTING.md` with setup guide, conventions, PR process
- `CHANGELOG.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `SUPPORT.md`
- English README with badges, architecture diagrams, and documentation
- 92 unit tests across format, cn, and export modules

### Changed
- **Auth removal**: Entire authentication system removed (simplifies setup)
- **Restructured** `components/` into subdirectories: `ui/`, `charts/`, `layout/`, `shared/`
- **Restructured** `lib/` into domain modules: `supabase/`, `export/`, `format/`
- **Replaced** hardcoded hex colors with CSS custom properties (14 new variables)
- **Consolidated** duplicate CSV export logic into `export.ts`
- **Extracted** `TEXTAREA_BASE` constant to `format.ts`, removed duplicates from 3 pages
- **Fixed** `formatRatio`, `formatCoverage` to show negative values instead of "0%"
- **Fixed** `parseDateValue` returning `new Date(NaN)` for invalid inputs
- **Fixed** duplicate SVG gradient ID in `data-viz.tsx` using `useId()`
- **Fixed** git repository corruption (re-cloned from origin)
- **Switched** vitest environment from `jsdom` to `happy-dom`
- **Sanitized** `.env` file: replaced real credentials with placeholders

### Security
- Added CSP, HSTS, X-Frame-Options, Permissions-Policy headers in `vercel.json`
- Removed Supabase service role key from frontend environment

## [1.0.0] - 2026-06

### Added
- Initial release: dashboard, projects, finances, timer, investments
- Supabase integration with PostgreSQL backend
- CSV, Excel, and PDF export
- Dark/light theme support
- Real-time sync with polling fallback
