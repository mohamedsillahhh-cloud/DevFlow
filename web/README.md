# DevFlow Web

Frontend web do DevFlow em React + Vite + TailwindCSS, com autenticação via Supabase e acesso restrito a um único e-mail autorizado.

## Variáveis de ambiente

O `vite.config.ts` lê o `.env` da raiz do repositório. Pode usar os nomes já usados pelo app Python ou os nomes com prefixo `VITE_`.

Obrigatórias:

- `VITE_ALLOWED_EMAIL`
- `SUPABASE_URL` ou `VITE_SUPABASE_URL`
- `SUPABASE_KEY` ou `VITE_SUPABASE_ANON_KEY`

## Desenvolvimento

```bash
cd web
npm install
npm run dev
```

## Verificação

```bash
npm run lint
npm run build
```

## Deploy

### Vercel

- Root Directory: `web`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables: usar as mesmas do `.env` da raiz

### Railway

- Working Directory: `web`
- Start Command: `npm run preview -- --host 0.0.0.0 --port $PORT`
- Environment Variables: iguais às do deploy na Vercel
