# DevFlow

Repositorio do DevFlow com duas interfaces para a mesma base Supabase:

- `web/`: frontend React + Vite para projetos, financas, investimentos e timer.
- raiz do projeto: cliente desktop em PyQt6.

## Ambiente

Copie `.env.example` para `.env` e preencha as variaveis necessarias:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `VITE_ALLOWED_EMAIL`

O frontend tambem aceita `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

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
