# DevFlow

Repositorio do DevFlow com duas interfaces para a mesma base Supabase:

- `web/`: frontend React + Vite para projetos, financas, investimentos e timer.
- raiz do projeto: cliente desktop em PyQt6.

## Ambiente

Preencha as variaveis necessarias:

- Desktop PyQt:
  - `SUPABASE_URL`
  - `SUPABASE_KEY`
- Frontend web:
  - `VITE_ALLOWED_EMAIL`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

No frontend use apenas a chave anon/publica do Supabase. Nao use service key no site estatico.

## Desenvolvimento

Frontend web:

```bash
cd web
npm install
npm run dev
```

Cliente desktop:

```bash
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python main.py
```

## Build do executavel

```bash
build.bat
```

## Deploy no Render

O Render serve apenas o frontend em `web/`. O cliente desktop em PyQt6 nao roda no Render.

Com este repositorio, pode criar um Static Site a partir do `render.yaml` na raiz. No primeiro deploy, informe:

- `VITE_ALLOWED_EMAIL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
