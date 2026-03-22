# DevFlow Web

Frontend web do DevFlow em React + Vite, com autenticacao Supabase e acesso restrito por e-mail.

## Variaveis de ambiente

O `vite.config.ts` le o `.env` da raiz do repositorio. Pode usar as variaveis compartilhadas com o cliente desktop ou as variantes com prefixo `VITE_`.

Obrigatorias:

- `VITE_ALLOWED_EMAIL`
- `SUPABASE_URL` ou `VITE_SUPABASE_URL`
- `SUPABASE_KEY` ou `VITE_SUPABASE_ANON_KEY`

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
