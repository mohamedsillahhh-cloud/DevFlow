# Database

## Schema

DevFlow uses a PostgreSQL database hosted on Supabase. Below are the core tables.

### `clientes`
Stores client/customer information.

| Column | Type | Description |
|---|---|---|
| id | BIGSERIAL PK | Auto-increment ID |
| nome | TEXT | Client name |
| criado_em | TIMESTAMPTZ | Creation timestamp |

### `projetos`
Project records with financial tracking.

| Column | Type | Description |
|---|---|---|
| id | BIGSERIAL PK | Auto-increment ID |
| cliente_id | BIGINT FK → clientes(id) | Associated client |
| titulo | TEXT | Project title |
| tipo | TEXT | Project type (e.g., branding, web app) |
| status | TEXT | Current status (pendente, em_andamento, pago_parcial, pago, concluido, cancelado) |
| valor_total | NUMERIC(12,2) | Total project value |
| valor_pago | NUMERIC(12,2) | Amount already paid |
| prazo | DATE | Project deadline |
| descricao | TEXT | Scope description |
| notas | TEXT | Internal notes |
| repo_url | TEXT | Repository URL |
| staging_url | TEXT | Staging/preview URL |
| criado_em | TIMESTAMPTZ | Creation timestamp |

### `gastos`
Expense records.

| Column | Type | Description |
|---|---|---|
| id | BIGSERIAL PK | Auto-increment ID |
| descricao | TEXT | Description |
| valor | NUMERIC(12,2) | Amount |
| data | DATE | Expense date |
| categoria_nome | TEXT | Category name |
| metodo | TEXT | Payment method |
| pago | BOOLEAN | Payment status |
| recorrente | BOOLEAN | Is recurring expense |
| dia_vencimento | INTEGER | Due day for recurring |
| notas | TEXT | Additional notes |
| criado_em | TIMESTAMPTZ | Creation timestamp |

### `receitas`
Income records.

| Column | Type | Description |
|---|---|---|
| id | BIGSERIAL PK | Auto-increment ID |
| descricao | TEXT | Description |
| valor | NUMERIC(12,2) | Amount |
| data | DATE | Income date |
| origem | TEXT | Source description |
| projeto_id | BIGINT FK → projetos(id) | Associated project |
| criado_em | TIMESTAMPTZ | Creation timestamp |

### `investimentos`
Investment asset records.

| Column | Type | Description |
|---|---|---|
| id | BIGSERIAL PK | Auto-increment ID |
| nome | TEXT | Asset name |
| tipo | TEXT | Asset type (ETF, stock, fund, savings) |
| meta_valor | NUMERIC(12,2) | Target value |
| meta_data | DATE | Target date |
| ativo | BOOLEAN | Active status |
| notas | TEXT | Notes |
| criado_em | TIMESTAMPTZ | Creation timestamp |

### `aportes`
Investment contributions, withdrawals, and returns.

| Column | Type | Description |
|---|---|---|
| id | BIGSERIAL PK | Auto-increment ID |
| investimento_id | BIGINT FK → investimentos(id) | Associated investment |
| tipo | TEXT | Type (aporte, resgate, rendimento) |
| valor | NUMERIC(12,2) | Amount |
| data | DATE | Transaction date |
| notas | TEXT | Notes |
| criado_em | TIMESTAMPTZ | Creation timestamp |

### `tempo_projeto`
Work time tracking entries.

| Column | Type | Description |
|---|---|---|
| id | BIGSERIAL PK | Auto-increment ID |
| projeto_id | BIGINT FK → projetos(id) | Associated project |
| inicio | TIMESTAMPTZ | Session start |
| fim | TIMESTAMPTZ | Session end (null if active) |
| duracao_min | INTEGER | Duration in minutes |
| descricao | TEXT | Session description |
| criado_em | TIMESTAMPTZ | Creation timestamp |

### `configuracoes`
Key-value configuration store.

| Column | Type | Description |
|---|---|---|
| chave | TEXT PK | Configuration key |
| valor | TEXT | Configuration value |

Known keys:
- `moeda` — Default currency (CVE, USD, EUR)
- `tema` — Theme preference (light, dark)
- `nome_usuario` — Display name
- `alerta_prazo_dias` — Days before deadline to alert
- `alerta_conta_dias` — Days before bill due to alert
- `caminho_backup` — Backup folder path
- `ultimo_backup` — Last backup timestamp
- `valor_hora_padrao` — Default hourly rate
- `valor_hora_projetos` — Per-project hourly rates (JSON)

### `pagamentos`
Payment records linked to projects.

| Column | Type | Description |
|---|---|---|
| id | BIGSERIAL PK | Auto-increment ID |
| projeto_id | BIGINT FK → projetos(id) | Associated project |
| valor | NUMERIC(12,2) | Payment amount |
| data | DATE | Payment date |
| metodo | TEXT | Payment method |
| criado_em | TIMESTAMPTZ | Creation timestamp |

## Relationships

```
clientes 1──N projetos
projetos 1──N receitas
projetos 1──N tempo_projeto
projetos 1──N pagamentos
investimentos 1──N aportes
```

## Row-Level Security (RLS)

The `database/supabase_policies.sql` file contains the RLS policies for all tables.
These policies should be applied in the Supabase SQL Editor after creating the tables.
