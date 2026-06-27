# Contributing

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Documentation

Before contributing, please read the relevant documentation in [`docs/`](docs/):
- [Architecture](docs/architecture.md) — Understand the component design
- [Database](docs/database.md) — Schema and relationships
- [Deployment](docs/deployment.md) — Setup and CI/CD
- [FAQ](docs/faq.md) — Common questions

## Project Structure

```
web/                  React 19 + Vite + TypeScript
├── src/
│   ├── components/
│   │   ├── charts/     Chart components (recharts)
│   │   ├── layout/     Layout components (sidebar, header)
│   │   ├── shared/     Shared feature components
│   │   └── ui/         Generic UI primitives
│   ├── hooks/          Custom React hooks
│   ├── lib/
│   │   ├── export/     Export utilities (CSV, XLSX, PDF)
│   │   ├── supabase/   Supabase client and data access
│   │   ├── cn.ts       Class name utility
│   │   ├── format.ts   Formatting and date utilities
│   │   ├── navigation.ts
│   │   ├── schemas.ts  Zod validation schemas
│   │   └── types.ts    Shared TypeScript types
│   ├── pages/          Route page components
│   └── test/           Vitest test files
├── public/
└── index.html
```

## Development Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your Supabase credentials
3. Run `cd web && npm install`
4. Run `npm run dev` to start the development server

## Code Style

- **TypeScript**: Strict mode enabled. Run `npm run typecheck` before committing
- **Formatting**: Prettier is configured. Run with your editor's format-on-save
- **ESLint**: Config is in `eslint.config.js`. Run `npm run lint` to check
- **Imports**: Use `@/` path alias for `src/` imports (e.g., `import { cx } from '@/lib/cn'`)

## Testing

- Tests are co-located in `src/test/` using Vitest
- Run `npm run test` to execute all tests
- Run `npm run test:watch` during development
- Add tests for new functionality in the appropriate file

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Ensure all checks pass:
   - `npm run typecheck` (zero errors)
   - `npm run test` (all tests green)
   - `npm run lint` (no warnings)
4. Open a pull request against `main`
5. A maintainer will review your changes

## Commit Messages

Use conventional commits: `type(scope): description`

Examples:
- `feat(faturas): add invoice generation`
- `fix(format): handle NaN in formatRatio`
- `refactor(components): restructure into subdirectories`
- `test(format): add formatCoverage tests`

## Environment Variables

See `.env.example` for all required variables. Never commit real credentials.
