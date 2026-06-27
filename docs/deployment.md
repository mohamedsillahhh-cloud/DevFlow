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

4. No environment variables are needed — the app runs entirely locally in the browser with IndexedDB
5. Deploy

### vercel.json

The project includes a `vercel.json` with:
- SPA rewrites (all routes → `index.html`)
- Security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy)

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
