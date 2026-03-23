# DevFlow Web

Frontend web do DevFlow em React + Vite, com autenticacao Supabase e acesso restrito por e-mail.

## Variaveis de ambiente

O `vite.config.ts` le o `.env` da raiz do repositorio e expoe apenas variaveis com prefixo `VITE_` para o bundle do frontend.

Obrigatorias:

- `VITE_ALLOWED_EMAIL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Use apenas a chave anon/publica do Supabase no frontend. Nao use service key.

## Desenvolvimento

```bash
cd web
npm install
npm run dev
```

## Verificacao

```bash
npm run lint
npm run build
```

## Deploy

Vercel:

- Root Directory: `web`
- Build Command: `npm run build`
- Output Directory: `dist`

Railway:

- Working Directory: `web`
- Start Command: `npm run preview -- --host 0.0.0.0 --port $PORT`

Render:

- Blueprint file: `render.yaml` na raiz do repositorio
- Tipo: Static Site
- Variaveis obrigatorias:
  - `VITE_ALLOWED_EMAIL`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Rewrite para SPA: `/* -> /index.html`
