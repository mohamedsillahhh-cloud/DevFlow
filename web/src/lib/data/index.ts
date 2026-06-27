import { liveQuery } from 'dexie'
import { mapConfiguracoes } from '../format'
import type {
  Aporte,
  ClienteSummary,
  ConfigMap,
  Gasto,
  Investimento,
  InvestimentoSummary,
  Projeto,
  ProjetoSummary,
  Receita,
  TempoProjeto,
} from '../types'
import {
  type DbAporte,
  type DbGasto,
  type DbInvestimento,
  type DbProjeto,
  type DbReceita,
  type DbTempoProjeto,
  db,
} from './db'

export interface CreateProjetoInput {
  clientName: string
  deadline?: string
  description?: string
  notes?: string
  repoUrl?: string
  stagingUrl?: string
  status?: string
  title: string
  totalValue?: number
  type?: string
}

export interface CreateGastoInput {
  category?: string
  date: string
  description: string
  dueDay?: number | null
  method?: string
  notes?: string
  paid?: boolean
  recurring?: boolean
  value: number
}

export interface CreateReceitaInput {
  date: string
  description: string
  projectId?: number | null
  source?: string
  value: number
}

export interface CreateInvestimentoInput {
  active?: boolean
  name: string
  notes?: string
  targetDate?: string | null
  targetValue?: number | null
  type: string
}

export interface CreateAporteInput {
  date: string
  investmentId: number
  notes?: string
  type?: string
  value: number
}

function cleanText(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed || null
}

function cleanDate(value?: string | null) {
  return value || null
}

function normalizeAmount(value: number | null | undefined) {
  return Number.isFinite(value) ? Number(value) : 0
}

function nowISO() {
  return new Date().toISOString()
}

function compactPayload<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as Partial<T>
}

async function resolveCliente(clienteId: number | null): Promise<ClienteSummary | null> {
  if (!clienteId) return null
  const c = await db.clientes.get(clienteId)
  if (!c) return null
  return { id: c.id!, nome: c.nome, email: c.email, empresa: c.empresa }
}

async function resolveProjetoSummary(projetoId: number | null): Promise<ProjetoSummary | null> {
  if (!projetoId) return null
  const p = await db.projetos.get(projetoId)
  if (!p) return null
  return { id: p.id!, titulo: p.titulo }
}

async function resolveInvestimentoSummary(investimentoId: number | null): Promise<InvestimentoSummary | null> {
  if (!investimentoId) return null
  const i = await db.investimentos.get(investimentoId)
  if (!i) return null
  return { id: i.id!, nome: i.nome, tipo: i.tipo }
}

function projetoToType(p: DbProjeto, cliente: ClienteSummary | null): Projeto {
  return {
    ...p,
    id: p.id!,
    clientes: cliente,
  }
}

function receitaToType(r: DbReceita, projeto: ProjetoSummary | null): Receita {
  return {
    ...r,
    id: r.id!,
    projetos: projeto,
  }
}

function aporteToType(a: DbAporte, investimento: InvestimentoSummary | null): Aporte {
  return {
    ...a,
    id: a.id!,
    investimentos: investimento,
  }
}

function tempoProjetoToType(t: DbTempoProjeto, projeto: ProjetoSummary | null): TempoProjeto {
  return {
    ...t,
    id: t.id!,
    projetos: projeto,
  }
}

async function createOrGetCliente(nome: string): Promise<number> {
  const clientName = nome.trim()
  if (!clientName) throw new Error('Informe o nome do cliente.')

  const existing = await db.clientes.where('nome').equals(clientName).first()
  if (existing) return existing.id!

  const id = await db.clientes.add({ nome: clientName })
  return id
}

// ── Queries ──────────────────────────────────────────────

export async function fetchConfiguracoes(): Promise<ConfigMap> {
  const rows = await db.configuracoes.toArray()
  return mapConfiguracoes(rows as unknown as Array<{ chave: string; valor: string }>)
}

export async function fetchProjetos(): Promise<Projeto[]> {
  const projetos = await db.projetos
    .orderBy('prazo')
    .filter((p) => p.prazo !== null)
    .reverse()
    .toArray()
  const semPrazo = await db.projetos
    .filter((p) => p.prazo === null)
    .toArray()
  const allProjetos = [...projetos, ...semPrazo]
  return Promise.all(
    allProjetos.map(async (p) => {
      const cliente = await resolveCliente(p.cliente_id)
      return projetoToType(p, cliente)
    }),
  )
}

export async function fetchGastos(): Promise<Gasto[]> {
  const gastos = await db.gastos.orderBy('data').reverse().toArray()
  return gastos.map((g) => ({ ...g, id: g.id! }))
}

export async function fetchReceitas(): Promise<Receita[]> {
  const receitas = await db.receitas.orderBy('data').reverse().toArray()
  return Promise.all(
    receitas.map(async (r) => {
      const projeto = await resolveProjetoSummary(r.projeto_id)
      return receitaToType(r, projeto)
    }),
  )
}

export async function fetchInvestimentos(): Promise<Investimento[]> {
  const items = await db.investimentos.orderBy('criado_em').reverse().toArray()
  return items.map((i) => ({ ...i, id: i.id! }))
}

export async function fetchAportes(): Promise<Aporte[]> {
  const items = await db.aportes.orderBy('data').reverse().toArray()
  return Promise.all(
    items.map(async (a) => {
      const investimento = await resolveInvestimentoSummary(a.investimento_id)
      return aporteToType(a, investimento)
    }),
  )
}

export async function fetchTempoProjeto(): Promise<TempoProjeto[]> {
  const items = await db.tempo_projeto.orderBy('inicio').reverse().toArray()
  return Promise.all(
    items.map(async (t) => {
      const projeto = await resolveProjetoSummary(t.projeto_id)
      return tempoProjetoToType(t, projeto)
    }),
  )
}

// ── Snapshots ─────────────────────────────────────────────

export async function fetchDashboardSnapshot() {
  const [configuracoes, projetos, gastos, receitas, investimentos, aportes, sessoes] =
    await Promise.all([
      fetchConfiguracoes(),
      fetchProjetos(),
      fetchGastos(),
      fetchReceitas(),
      fetchInvestimentos(),
      fetchAportes(),
      fetchTempoProjeto(),
    ])
  return { aportes, configuracoes, gastos, investimentos, projetos, receitas, sessoes }
}

export async function fetchProjectsSnapshot() {
  const [configuracoes, projetos] = await Promise.all([fetchConfiguracoes(), fetchProjetos()])
  return { configuracoes, projetos }
}

export async function fetchFinanceSnapshot() {
  const [configuracoes, gastos, projetos, receitas] = await Promise.all([
    fetchConfiguracoes(),
    fetchGastos(),
    fetchProjetos(),
    fetchReceitas(),
  ])
  return { configuracoes, gastos, projetos, receitas }
}

export async function fetchInvestmentsSnapshot() {
  const [configuracoes, investimentos, aportes] = await Promise.all([
    fetchConfiguracoes(),
    fetchInvestimentos(),
    fetchAportes(),
  ])
  return { aportes, configuracoes, investimentos }
}

export async function fetchTimerSnapshot() {
  const [configuracoes, projetos, sessoes] = await Promise.all([
    fetchConfiguracoes(),
    fetchProjetos(),
    fetchTempoProjeto(),
  ])
  return { configuracoes, projetos, sessoes }
}

// ── Mutations: Timer ──────────────────────────────────────

export async function startWorkSession(projetoId: number, descricao?: string) {
  const active = await db.tempo_projeto.filter((t) => t.fim === null).first()
  if (active) {
    throw new Error('Ja existe uma sessao ativa. Termine a sessao atual antes de iniciar outra.')
  }
  await db.tempo_projeto.add({
    descricao: descricao?.trim() || null,
    inicio: nowISO(),
    fim: null,
    duracao_min: null,
    projeto_id: projetoId,
    criado_em: nowISO(),
  })
}

export async function stopWorkSession(session: TempoProjeto, descricao?: string) {
  const end = new Date()
  const durationMinutes = Math.max(
    Math.floor((end.getTime() - new Date(session.inicio).getTime()) / 60000),
    0,
  )
  await db.tempo_projeto.update(session.id, {
    descricao: descricao?.trim() || session.descricao || null,
    duracao_min: durationMinutes,
    fim: end.toISOString(),
  })
}

// ── Mutations: Config ─────────────────────────────────────

export async function saveConfiguracoes(values: ConfigMap) {
  const payload = Object.entries(values).map(([chave, valor]) => ({ chave, valor }))
  await db.transaction('rw', db.configuracoes, async () => {
    for (const row of payload) {
      await db.configuracoes.put(row, row.chave)
    }
  })
}

// ── Mutations: Projetos ───────────────────────────────────

export async function createProjeto(input: CreateProjetoInput) {
  const title = input.title.trim()
  if (!title) throw new Error('Informe o titulo do projeto.')

  const clientId = await createOrGetCliente(input.clientName)
  const payload = compactPayload({
    atualizado_em: nowISO(),
    cliente_id: clientId,
    criado_em: nowISO(),
    descricao: cleanText(input.description),
    notas: cleanText(input.notes),
    prazo: cleanDate(input.deadline),
    repo_url: cleanText(input.repoUrl),
    staging_url: cleanText(input.stagingUrl),
    status: cleanText(input.status) ?? 'pendente',
    tipo: cleanText(input.type),
    titulo: title,
    valor_pago: 0,
    valor_total: normalizeAmount(input.totalValue),
  })
  await db.projetos.add(payload as unknown as DbProjeto)
}

export async function updateProjetoStatus(projectId: number, status: string) {
  const nextStatus = cleanText(status)?.toLowerCase()
  if (!nextStatus) throw new Error('Selecione um status valido.')
  await db.projetos.update(projectId, {
    atualizado_em: nowISO(),
    status: nextStatus,
  })
}

export async function deleteProjeto(projectId: number) {
  await db.pagamentos.where('projeto_id').equals(projectId).delete()
  await db.receitas.where('projeto_id').equals(projectId).delete()
  await db.tempo_projeto.where('projeto_id').equals(projectId).delete()
  await db.projetos.delete(projectId)
}

// ── Mutations: Gastos ─────────────────────────────────────

export async function createGasto(input: CreateGastoInput) {
  const description = input.description.trim()
  if (!description) throw new Error('Informe a descricao do gasto.')
  if (!input.date) throw new Error('Informe a data do gasto.')
  if (normalizeAmount(input.value) <= 0) throw new Error('O valor do gasto deve ser maior do que zero.')

  const payload = compactPayload({
    categoria_nome: cleanText(input.category),
    criado_em: nowISO(),
    data: input.date,
    descricao: description,
    dia_vencimento: input.recurring ? input.dueDay ?? null : null,
    metodo: cleanText(input.method),
    notas: cleanText(input.notes),
    pago: input.paid === false ? 0 : 1,
    recorrente: input.recurring ? 1 : 0,
    valor: normalizeAmount(input.value),
  })
  await db.gastos.add(payload as unknown as DbGasto)
}

export async function deleteGasto(expenseId: number) {
  await db.gastos.delete(expenseId)
}

// ── Mutations: Receitas ───────────────────────────────────

export async function createReceita(input: CreateReceitaInput) {
  const description = input.description.trim()
  if (!description) throw new Error('Informe a descricao da receita.')
  if (!input.date) throw new Error('Informe a data da receita.')
  if (normalizeAmount(input.value) <= 0) throw new Error('O valor da receita deve ser maior do que zero.')

  const payload = compactPayload({
    criado_em: nowISO(),
    data: input.date,
    descricao: description,
    origem: cleanText(input.source),
    projeto_id: input.projectId ?? null,
    valor: normalizeAmount(input.value),
  })
  await db.receitas.add(payload as unknown as DbReceita)
}

export async function deleteReceita(receiptId: number) {
  await db.receitas.delete(receiptId)
}

// ── Mutations: Investimentos ──────────────────────────────

export async function createInvestimento(input: CreateInvestimentoInput) {
  const name = input.name.trim()
  const type = input.type.trim()
  if (!name) throw new Error('Informe o nome do investimento.')
  if (!type) throw new Error('Informe o tipo do investimento.')

  const payload = compactPayload({
    ativo: input.active === false ? 0 : 1,
    criado_em: nowISO(),
    meta_data: cleanDate(input.targetDate),
    meta_valor:
      input.targetValue === null || input.targetValue === undefined
        ? null
        : normalizeAmount(input.targetValue),
    nome: name,
    notas: cleanText(input.notes),
    tipo: type,
  })
  await db.investimentos.add(payload as unknown as DbInvestimento)
}

export async function deleteInvestimento(investmentId: number) {
  await db.aportes.where('investimento_id').equals(investmentId).delete()
  await db.investimentos.delete(investmentId)
}

// ── Mutations: Aportes ────────────────────────────────────

export async function createAporte(input: CreateAporteInput) {
  if (!input.investmentId) throw new Error('Selecione um investimento.')
  if (!input.date) throw new Error('Informe a data do movimento.')
  if (normalizeAmount(input.value) <= 0) throw new Error('O valor do movimento deve ser maior do que zero.')

  const payload = compactPayload({
    criado_em: nowISO(),
    data: input.date,
    investimento_id: input.investmentId,
    notas: cleanText(input.notes),
    tipo: cleanText(input.type)?.toLowerCase() ?? 'aporte',
    valor: normalizeAmount(input.value),
  })
  await db.aportes.add(payload as unknown as DbAporte)
}

export async function deleteAporte(contributionId: number) {
  await db.aportes.delete(contributionId)
}

// ── liveQuery helper ──────────────────────────────────────

export function observeQuery<T>(queryFn: () => Promise<T>) {
  return liveQuery(queryFn)
}
