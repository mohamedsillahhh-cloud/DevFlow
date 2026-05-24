

# DevFlow
**Painel de gestão pessoal para freelancers**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![PyQt6](https://img.shields.io/badge/PyQt6-Desktop-41CD52?style=flat-square&logo=python)](https://pypi.org/project/PyQt6)



---

## Visão Geral

O DevFlow é uma aplicação full-stack com duas interfaces independentes conectadas ao mesmo banco Supabase:

| Interface | Tecnologia | Descrição |
|---|---|---|
| `web/` | React 19 + Vite + TypeScript | Dashboard web — projetos, finanças, investimentos e timer |
| Raiz | PyQt6 | Cliente desktop nativo para uso local |

---

## Funcionalidades

- **Dashboard** — KPIs, pipeline e visão executiva do negócio
- **Projetos** — gestão de clientes, status, pagamentos e prazos
- **Finanças** — receitas, despesas, fluxo de caixa e agenda
- **Investimentos** — carteira, aportes e metas
- **Timer** — cronômetro por projeto com faturamento estimado
- **Autenticação** — Supabase Auth com allowlist de emails

---

## Estrutura do Projeto

~~~
devflow/
├── web/                  # Interface web (React + Vite)
│   ├── src/
│   │   ├── components/   # Componentes reutilizáveis
│   │   ├── pages/        # Páginas principais
│   │   ├── hooks/        # Custom hooks
│   │   ├── lib/          # Supabase client e utilitários
│   │   └── contexts/     # Contextos de autenticação
│   └── .env.local        # Variáveis de ambiente (não commitar)
├── supabase/
│   └── migrations/       # Histórico de migrações SQL
├── main.py               # Ponto de entrada do cliente desktop
├── requirements.txt      # Dependências Python
└── render.yaml           # Configuração de deploy
~~~

---

## Configuração do Ambiente

### Interface Web (`web/.env.local`)

~~~env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_ALLOWED_EMAILS=email@exemplo.com
~~~

### Cliente Desktop (`.env` na raiz)

~~~env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
~~~

> **Segurança:** A interface web utiliza exclusivamente a `anon key` (pública) do Supabase.  
> A `service_role key` nunca deve ser exposta em aplicações client-side.

---

## Executar Localmente

### Interface Web

~~~bash
cd web
npm install
npm run dev
# Acede em http://localhost:5173
~~~

### Cliente Desktop

~~~bash
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python main.py
~~~

### Gerar Executável (.exe)

~~~bash
build.bat
~~~

---

## Deploy em Produção

O projeto está configurado para deploy no **Render** via `render.yaml`.

**Passos:**

1. Cria um novo **Static Site** no [Render](https://render.com)
2. Conecta este repositório
3. Define as variáveis de ambiente no painel do Render:

~~~
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_ALLOWED_EMAILS
~~~

> Apenas a interface web (`web/`) é servida no Render.  
> O cliente PyQt6 é distribuído como executável desktop local.

---

## Segurança

- Row Level Security (RLS) ativo em todas as tabelas
- Autenticação via Supabase Auth com allowlist de emails
- Apenas a `anon key` exposta no frontend
- Migrações versionadas em `supabase/migrations/`

---

## Stack Técnica

**Frontend Web**
- React 19 + TypeScript + Vite
- Supabase JS Client
- Zod (validação)
- React Router

**Desktop**
- Python + PyQt6
- Supabase Python Client

**Backend / Banco**
- Supabase (PostgreSQL + Auth + Realtime)
- Row Level Security (RLS)

---

<div align="center">
  <sub>Desenvolvido por Mohamed · DevFlow v1.10.02</sub>
</div>

OBRIGADO PELA ATENÇÃO
