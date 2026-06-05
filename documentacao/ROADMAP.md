# DevFlow — Roadmap de Evolução

> **Stack:** React 19 + TypeScript + Vite (Web) | PyQt6 (Desktop) | Supabase (PostgreSQL + Auth + Storage)  
> **Versão atual:** 1.10.02

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Fase 1 — Core Improvements](#fase-1--core-improvements)
3. [Fase 2 — Novos Módulos Principais](#fase-2--novos-módulos-principais)
4. [Fase 3 — Integrações e Analytics](#fase-3--integrações-e-analytics)
5. [Fase 4 — Escalabilidade + Mobile](#fase-4--escalabilidade--mobile)
6. [Ideias Futuras (Backlog)](#ideias-futuras-backlog)
7. [Estrutura de Dados — Novas Tabelas](#estrutura-de-dados--novas-tabelas)
8. [Estimativa de Esforço](#estimativa-de-esforço)

---

## Visão Geral

O DevFlow é um sistema de gestão pessoal para freelancers com duas interfaces independentes conectadas ao mesmo banco Supabase:

| Interface | Tecnologia | Finalidade |
|---|---|---|
| `web/` | React 19 + Vite + TypeScript | Dashboard web — projetos, finanças, investimentos e timer |
| Raiz (desktop) | Python + PyQt6 | Cliente desktop nativo para uso local |

### Funcionalidades Atuais

- Dashboard com KPIs, gráficos (receitas vs despesas), gastos por categoria
- Gestão de Projetos (CRUD, pipeline, status, pagamentos)
- Finanças (receitas, despesas, contas recorrentes)
- Investimentos (carteira, metas, aportes)
- Timer com faturamento estimado por projeto
- Chat integrado (desktop)
- Configurações (nome, moeda, tema, alertas)
- Exportação CSV / Excel / PDF
- Autenticação Supabase com allowlist de emails
- Real-time sync via polling

---

## Fase 1 — Core Improvements

> **Esforço estimado:** ~20-30h  
> **Objetivo:** Melhorar a base existente antes de adicionar novos módulos.

### 1.1 Supabase Realtime (substituir polling)

**Problema:** O sistema atual faz polling a cada 8-15s para atualizar dados.  
**Solução:** Usar Supabase Realtime subscriptions para atualizações instantâneas.

**Tarefas:**
- [ ] Criar hook `useRealtimeSubscription(channel, table, callback)` em `web/src/hooks/`
- [ ] Substituir `setInterval` nos componentes pelo novo hook
- [ ] Manter polling como fallback se Realtime não estiver disponível
- [ ] Configurar RLS para Realtime nas tabelas existentes

**Arquivos afetados:**
- `web/src/hooks/use-realtime-sync.ts` — refatorar
- `web/src/lib/supabase.ts` — configurar canal Realtime
- `web/src/pages/*.tsx` — substituir polling

### 1.2 Testes Automatizados

**Problema:** Vitest e testing-library estão nas dependências mas não há testes.  
**Solução:** Adicionar testes unitários e de integração nos componentes críticos.

**Tarefas:**
- [ ] Configurar vitest (já existe `vitest.config.ts`)
- [ ] Adicionar testes para `web/src/lib/format.ts` (formatação de moeda, datas)
- [ ] Adicionar testes para `web/src/lib/cn.ts` (classname utility)
- [ ] Adicionar testes para `web/src/lib/csv.ts` e `web/src/lib/excel.ts` (exportação)
- [ ] Adicionar testes para componentes de tabela e stat-card
- [ ] Configurar GitHub Actions para rodar testes no push/PR

### 1.3 Modo Claro

**Problema:** Tema claro está parcialmente configurado (`data-theme` no localStorage) mas não implementado.  
**Solução:** Completar o design system com cores para light mode.

**Tarefas:**
- [ ] Definir cores light mode no `tailwind.config.js`
- [ ] Atualizar `index.css` com variáveis CSS para light mode
- [ ] Atualizar `ConfigPage` para alternar entre dark/light
- [ ] Testar todos os componentes nos dois modos

### 1.4 Ações em Massa

**Tarefas:**
- [ ] Adicionar checkboxes nas tabelas (projetos, gastos, receitas)
- [ ] Botão "Selecionar todos" no cabeçalho
- [ ] Barra de ações: Exportar selecionados, Deletar selecionados, Alterar status
- [ ] Confirmação com contagem de itens

### 1.5 Atalhos de Teclado

**Tarefas:**
- [ ] Criar hook `useKeyboardShortcuts(shortcuts: Record<string, () => void>)`
- [ ] Implementar navegação rápida: `g+d` (dashboard), `g+p` (projetos), `g+f` (finanças), `g+i` (investimentos), `g+t` (timer), `g+,` (config)
- [ ] `n` para novo item na página atual
- [ ] `?` para mostrar modal de atalhos

### 1.6 Onboarding Interativo

**Tarefas:**
- [ ] Criar componente `OnboardingTour` com steps configuráveis
- [ ] Mostrar na primeira vez que o usuário acessa (verificar `configuracao` `onboarding_complete`)
- [ ] Steps: boas-vindas, navegação, como criar projeto, como registrar horas
- [ ] Botão "Pular tour" e "Reiniciar tour" nas configurações

### 1.7 Estados Vazios Melhorados

**Tarefas:**
- [ ] Criar componente `EmptyState` com props: `icon`, `title`, `description`, `actionLabel`, `actionLink`
- [ ] Adicionar ilustrações SVG para cada tipo de estado vazio
- [ ] Substituir estados vazios atuais em todas as páginas

---

## Fase 2 — Novos Módulos Principais

> **Esforço estimado:** ~60-80h  
> **Objetivo:** Adicionar as funcionalidades de maior valor para o usuário.

### 2.1 Módulo de Faturamento

**Descrição:** Gerar faturas profissionais a partir de projetos com templates, status workflow e PDF.

**Estrutura:**

```
/financas/faturas        → Lista de faturas
/financas/faturas/nova   → Criar fatura
/financas/faturas/:id    → Detalhe / editar
```

**Modelo de dados (nova tabela `faturas`):**

```sql
CREATE TABLE faturas (
  id            BIGSERIAL PRIMARY KEY,
  numero        TEXT NOT NULL UNIQUE,          -- NF-2026-0001
  projeto_id    BIGINT REFERENCES projetos(id) ON DELETE SET NULL,
  cliente_nome  TEXT NOT NULL,
  cliente_email TEXT,
  cliente_nif   TEXT,                          -- NIF / contribuinte
  endereco      TEXT,
  data_emissao  DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL,
  descricao     TEXT,                          -- descrição geral
  itens         JSONB NOT NULL,                -- [{descricao, quantidade, valor_unitario, total}]
  valor_total   NUMERIC(12,2) NOT NULL,
  valor_pago    NUMERIC(12,2) DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'rascunho',
                -- rascunho | enviada | paga | parcial | vencida | cancelada
  pdf_url       TEXT,                          -- URL do PDF no Supabase Storage
  notas         TEXT,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);
```

**Tarefas:**
- [ ] Criar migration SQL para tabela `faturas`
- [ ] Adicionar tipos TypeScript em `web/src/lib/types.ts`
- [ ] Adicionar queries no `SupabaseRepository` (Python) e `supabase-data.ts` (TS)
- [ ] Criar página `/financas/faturas` com lista, filtros (status, mês), totais
- [ ] Criar formulário de criação: selecionar projeto → pré-preenche cliente e itens
- [ ] Gerar número automático: `NF-{ano}-{sequencial}`
- [ ] Gerar PDF com template (usar `jspdf` + `jspdf-autotable` já instalados)
- [ ] Upload do PDF para Supabase Storage
- [ ] Workflow de status com ações: Enviar, Marcar como paga, Cancelar
- [ ] Botão "Duplicar fatura" para recorrência
- [ ] Resumo no dashboard: total a receber em faturas abertas

**Desktop (PyQt6):**
- [ ] Adicionar tabela `faturas` nos models
- [ ] Adicionar página de faturas na sidebar
- [ ] Diálogo de criação de fatura
- [ ] Exportar fatura em PDF via `reportlab`

### 2.2 Gestão de Clientes

**Descrição:** Página dedicada com perfil completo, histórico e métricas por cliente.

**Estrutura:**

```
/clientes              → Lista de clientes
/clientes/novo         → Criar cliente
/clientes/:id          → Perfil do cliente
```

**Modelo de dados (tabela `clientes` já existe — expandir):**

```sql
-- Adicionar colunas à tabela existente
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS nif TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS site TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tags TEXT[];         -- ex: {recorrente, premium}
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

**Tarefas:**
- [ ] Migration SQL para expandir tabela `clientes`
- [ ] Página `/clientes` com tabela pesquisável, filtro por tags
- [ ] Métricas por cliente: total faturado, total recebido, projetos ativos, ticket médio
- [ ] Perfil do cliente: info, timeline de projetos, histórico de faturas, pagamentos
- [ ] Vincular cliente automaticamente ao criar projeto (já existe — melhorar)
- [ ] Avatar / foto do cliente
- [ ] Adicionar à navegação principal

### 2.3 Kanban / Task Board

**Descrição:** Quadro kanban drag-and-drop para organizar tarefas dentro de projetos, com subtarefas e checklists.

**Estrutura:**

```
/projetos/:id/kanban   → Quadro kanban do projeto
/projetos/:id/tarefas  → Lista de tarefas (visão tabela)
```

**Modelo de dados (nova tabela `tarefas`):**

```sql
CREATE TABLE tarefas (
  id            BIGSERIAL PRIMARY KEY,
  projeto_id    BIGINT NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  titulo        TEXT NOT NULL,
  descricao     TEXT,
  status        TEXT NOT NULL DEFAULT 'pendente',
                -- pendente | fazendo | revisao | concluido
  prioridade    TEXT NOT NULL DEFAULT 'media',
                -- baixa | media | alta | urgente
  coluna_ordem  INTEGER NOT NULL DEFAULT 0,     -- posição no kanban
  responsavel   TEXT,                            -- email do responsável
  estimativa_min INTEGER,                        -- estimativa em minutos
  data_limite   DATE,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subtarefas (
  id            BIGSERIAL PRIMARY KEY,
  tarefa_id     BIGINT NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,
  titulo        TEXT NOT NULL,
  concluida     BOOLEAN NOT NULL DEFAULT FALSE,
  ordem         INTEGER NOT NULL DEFAULT 0,
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);
```

**Tarefas:**
- [ ] Migration SQL para `tarefas` e `subtarefas`
- [ ] Instalar `@dnd-kit/core` e `@dnd-kit/sortable` para drag-and-drop
- [ ] Criar componente `KanbanBoard` com colunas: Pendente, Fazendo, Revisão, Concluído
- [ ] Criar componente `KanbanCard` com título, prioridade, checkbox de subtarefas, estimativa
- [ ] Drag-and-drop entre colunas com persistência no banco
- [ ] Modal de detalhe da tarefa: editar, subtarefas, comentários
- [ ] Visão tabela "/projetos/:id/tarefas" com filtros
- [ ] Badge de contagem de tarefas no header do projeto
- [ ] Adicionar campo `coluna_ordem` para ordenação customizada

---

## Fase 3 — Integrações e Analytics

> **Esforço estimado:** ~40-50h  
> **Objetivo:** Relatórios avançados, integrações com ferramentas externas e upload de arquivos.

### 3.1 Relatórios Avançados

**Estrutura:**

```
/relatorios              → Dashboard de relatórios
/relatorios/dre          → Demonstrativo de Resultados
/relatorios/anual        → Comparativo anual
/relatorios/fiscal       → Relatório fiscal (ano)
```

**Tarefas:**
- [ ] Criar página `/relatorios` com cards de acesso aos relatórios
- [ ] **DRE (Demonstrativo de Resultados):**
  - Receitas brutas, deduções, receitas líquidas
  - Despesas por categoria
  - Lucro operacional, margem
  - Período selecionável (mês/trimestre/ano customizado)
- [ ] **Comparativo Anual:**
  - Tabela 12 meses: receitas, despesas, saldo, margem, variação %
  - Gráfico de barras comparativo ano anterior
- [ ] **Relatório Fiscal:**
  - Total de receitas por mês
  - Total de despesas dedutíveis
  - Base de cálculo estimada
- [ ] Exportar relatórios em PDF formatado com template
- [ ] Dashboard customizável com widgets arrastáveis (usar `react-grid-layout` ou similar)
  - Salvar layout por usuário nas configurações

### 3.2 Upload de Arquivos (Supabase Storage)

**Tarefas:**
- [ ] Criar bucket `arquivos` no Supabase Storage
- [ ] Configurar RLS para o bucket (usuário autenticado pode ler/escrever)
- [ ] Criar componente `FileUpload` com drag-and-drop, progresso, preview
- [ ] Criar componente `FileList` com nome, tamanho, tipo, data, botão download/deletar
- [ ] Associar arquivos a entidades via tabela `arquivos`:

```sql
CREATE TABLE arquivos (
  id            BIGSERIAL PRIMARY KEY,
  entidade_tipo TEXT NOT NULL,   -- 'projeto' | 'cliente' | 'tarefa' | 'fatura'
  entidade_id   BIGINT NOT NULL,
  nome          TEXT NOT NULL,
  tamanho       INTEGER NOT NULL,
  tipo          TEXT NOT NULL,   -- mime type
  storage_path  TEXT NOT NULL,   -- path no Supabase Storage
  url           TEXT,
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);
```

- [ ] Upload na página do projeto, perfil do cliente, detalhe da tarefa
- [ ] Preview de imagens e PDFs inline
- [ ] Limitar tipos permitidos por configuração
- [ ] Mostrar na dashboard: "5 arquivos carregados este mês"

### 3.3 Integração GitHub

**Tarefas:**
- [ ] Adicionar campo `repo_url` no projeto (já existe)
- [ ] Usar GitHub API (sem token para repositórios públicos)
- [ ] Mostrar no projeto: últimos commits, branch ativa, PRs abertos
- [ ] Badge no dashboard: "3 repositórios ativos"
- [ ] Vincular tempo do timer a commits (opcional)

### 3.4 Google Calendar Sync

**Tarefas:**
- [ ] Integrar Google Calendar API com OAuth2
- [ ] Sincronizar prazos de projetos como eventos
- [ ] Sincronizar vencimento de contas como eventos
- [ ] Botão "Adicionar ao Google Calendar" em prazos
- [ ] Configuração: ativar/desativar sync, cor por tipo

---

## Fase 4 — Escalabilidade + Mobile

> **Esforço estimado:** ~50-70h  
> **Objetivo:** Tornar a aplicação acessível mobile, offline e com notificações.

### 4.1 PWA / Mobile-First

**Tarefas:**
- [ ] Configurar service worker com Workbox (via Vite plugin `vite-plugin-pwa`)
- [ ] Manifest.json com ícones e splash screen
- [ ] Estratégia de cache: NetworkFirst para dados, StaleWhileRevalidate para assets
- [ ] IndexedDB (via Dexie.js ou idb) para cache de dados offline
- [ ] Sincronizar alterações quando voltar online (background sync)
- [ ] Layout responsivo: sidebar vira bottom nav em mobile
- [ ] Timer mobile: iniciar/parar sessão com um toque
- [ ] Touch-friendly: botões maiores, swipe gestures

### 4.2 Notificações

**Tarefas:**
- [ ] **Push Notifications (Web):**
  - Configurar VAPID keys no Supabase
  - Pedir permissão ao usuário
  - Enviar notificações via Supabase Edge Functions ou webhook
- [ ] **Email Notifications:**
  - Usar Resend / SendGrid / Supabase built-in email
  - Template de email para: fatura vencida, prazo próximo, conta a pagar
  - Configuração: quais notificações receber
- [ ] **In-App Notification Center:**
  - Tabela `notificacoes` (id, tipo, titulo, mensagem, lida, link, criado_em)
  - Sino no header com contagem de não lidas
  - Dropdown com últimas 5 notificações
  - Página `/notificacoes` com histórico completo
  - Marcar como lida / marcar todas como lidas

```sql
CREATE TABLE notificacoes (
  id        BIGSERIAL PRIMARY KEY,
  tipo      TEXT NOT NULL,    -- 'prazo' | 'fatura' | 'conta' | 'sistema'
  titulo    TEXT NOT NULL,
  mensagem  TEXT,
  link      TEXT,            -- para onde levar ao clicar
  lida      BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3 Multi-moeda

**Tarefas:**
- [ ] Adicionar campo `moeda` na tabela `projetos` (padrão: CVE)
- [ ] Adicionar campo `moeda` na tabela `receitas`
- [ ] Configuração de taxa de câmbio (manual ou via API)
- [ ] Exibir valores na moeda original + convertido para moeda base
- [ ] Relatórios consolidados com conversão

### 4.4 Importação de Dados

**Tarefas:**
- [ ] Importar projetos de Trello (CSV export)
- [ ] Importar de Jira (CSV)
- [ ] Importar extratos bancários (OFX, QIF, CSV)
- [ ] Mapeamento de colunas com preview
- [ ] Detecção automática de formato
- [ ] Relatório de importação: quantos itens importados, erros

### 4.5 Metas e OKRs

**Estrutura:**

```
/metas                   → Dashboard de metas
```

**Tarefas:**
- [ ] Tabela `metas` (id, tipo, titulo, valor_meta, valor_atual, periodo_inicio, periodo_fim)

```sql
CREATE TABLE metas (
  id             BIGSERIAL PRIMARY KEY,
  tipo           TEXT NOT NULL,    -- 'receita_mensal' | 'projetos_mes' | 'horas_mes' | 'economia'
  titulo         TEXT NOT NULL,
  descricao      TEXT,
  valor_meta     NUMERIC(12,2) NOT NULL,
  valor_atual    NUMERIC(12,2) DEFAULT 0,
  periodo_inicio DATE NOT NULL,
  periodo_fim    DATE NOT NULL,
  cor            TEXT DEFAULT '#00E5C0',
  criado_em      TIMESTAMPTZ DEFAULT NOW()
);
```

- [ ] Página `/metas` com cards de progresso circulares
- [ ] Metas pré-definidas: receita mensal, projetos por mês, horas por mês
- [ ] Metas customizadas pelo usuário
- [ ] Alertas quando perto de atingir ou fora do trilho

---

## Ideias Futuras (Backlog)

- **Assinaturas / Recorrência** — faturas recorrentes automáticas
- **Contratos Digitais** — templates, assinatura eletrônica (DocuSign / Lexmark)
- **IA / Machine Learning:**
  - Categorização automática de gastos
  - Previsão de fluxo de caixa
  - Estimativa inteligente de valor de projeto
  - Detecção de anomalias em despesas
- **Gateway de Pagamento** — Stripe/PayPal integrado para cobrar faturas online
- **Marketplace de Templates** — templates de fatura e relatório
- **Módulo de Estoque** — para quem vende produtos digitais/físicos
- **API Pública** — endpoints REST para integração com outras ferramentas
- **Desktop App Eletrônico** — versão desktop com Tauri/Electron (alternativa ao PyQt6)
- **Audit Log** — histórico completo de todas as alterações
- **Modo Lixeira** — soft delete com recuperação

---

## Estrutura de Dados — Novas Tabelas

### Resumo das tabelas a criar:

| Tabela | Fase | Finalidade |
|---|---|---|
| `faturas` | 2 | Faturamento profissional |
| `tarefas` | 2 | Kanban / task board |
| `subtarefas` | 2 | Checklists dentro de tarefas |
| `arquivos` | 3 | Upload de arquivos |
| `notificacoes` | 4 | Central de notificações |
| `metas` | 4 | OKRs e metas financeiras |

### Alterações em tabelas existentes:

| Tabela | Alteração |
|---|---|
| `clientes` | + `nif`, `endereco`, `site`, `tags`, `avatar_url` |
| `projetos` | + `moeda` |
| `receitas` | + `moeda` |

---

## Estimativa de Esforço

| Fase | Horas | Sprint (2 sem) | Dependências |
|---|---|---|---|
| **Fase 1** — Core Improvements | ~20-30h | 1 sprint | Nenhuma |
| **Fase 2** — Novos Módulos | ~60-80h | 2-3 sprints | Fase 1 |
| **Fase 3** — Integrações | ~40-50h | 1-2 sprints | Fase 2 |
| **Fase 4** — Mobile + Escalabilidade | ~50-70h | 2 sprints | Fase 1 (testes) |
| **Total** | **~170-230h** | **6-8 sprints** | — |

> **Nota:** Cada sprint considera ~20h de trabalho dedicado (2-3h/dia).

---

## Recomendação de Ordem

```
Semana 1-2   → Fase 1 (Realtime + Testes + Melhorias rápidas)
Semana 3-5   → Fase 2.1 (Faturamento)
Semana 6-7   → Fase 2.2 (Clientes)
Semana 8-10  → Fase 2.3 (Kanban)
Semana 11-12 → Fase 3 (Relatórios + Arquivos)
Semana 13-14 → Fase 3 (Integrações)
Semana 15-17 → Fase 4 (PWA + Notificações)
Semana 18-20 → Fase 4 (Multi-moeda + Importação + Metas)
```

---

<div align="center">
  <sub>DevFlow Roadmap — v1.0 — Gerado em Junho 2026</sub>
</div>
