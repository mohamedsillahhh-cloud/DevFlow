# Deployment

## Vercel (Recommended)

### Setup

1. Push your repository to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Configure the project:

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Root Directory | `web` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

4. Add environment variables:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

5. Deploy

### vercel.json

The project includes a `vercel.json` with:
- SPA rewrites (all routes → `index.html`)
- Security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy)

## Supabase

### Project Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Run the SQL from `database/supabase_policies.sql` in the SQL Editor
3. Get your project URL and anon key from Settings → API

### Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## CI/CD

### GitHub Actions

The project includes a CI pipeline that runs on every push/PR:

```yaml
- npm ci          # Clean install
- npm run lint    # ESLint check
- npm run typecheck  # TypeScript check
- npm run test    # Unit tests
- npm run build   # Production build
```

## Manual Build

```bash
cd web
npm install
npm run typecheck
npm run test
npm run build
```

The output will be in `web/dist/`.
