import { mapConfiguracoes } from './format'
import { supabase } from './supabase'
import type {
  Aporte,
  ClienteSummary,
  ConfigMap,
  Configuracao,
  Gasto,
  Investimento,
  Projeto,
  Receita,
  TempoProjeto,
} from './types'

const AUTH_ERROR_PATTERNS = [
  'auth session missing',
  'invalid claim',
  'invalid jwt',
  'jwt',
  'refresh token',
  'refresh_token',
  'session',
  'token',
]

const NETWORK_ERROR_PATTERNS = ['failed to fetch', 'fetch failed', 'network']
const MISSING_SCHEMA_PATTERNS = ['does not exist', 'could not find', 'schema cache']

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

function matchesAnyPattern(message: string, patterns: string[]) {
  const normalized = message.toLowerCase()
  return patterns.some((pattern) => normalized.includes(pattern))
}

async function normalizeSupabaseError(message: string, fallbackMessage: string) {
  if (matchesAnyPattern(message, AUTH_ERROR_PATTERNS)) {
    await supabase.auth.signOut()
    return 'Sessao invalida. Faz logout e entra novamente.'
  }

  if (matchesAnyPattern(message, NETWORK_ERROR_PATTERNS)) {
    return 'Erro de ligacao ao Supabase. Verifica a internet e as credenciais.'
  }

  return message || fallbackMessage
}

async function getRows<T>(
  promise: PromiseLike<unknown>,
  fallbackMessage: string,
): Promise<T[]> {
  let response: { data: T[] | null; error: { message: string } | null }

  try {
    response = (await promise) as { data: T[] | null; error: { message: string } | null }
  } catch (caughtError) {
    const rawMessage = caughtError instanceof Error ? caughtError.message : fallbackMessage
    throw new Error(await normalizeSupabaseError(rawMessage, fallbackMessage))
  }

  const { data, error } = response

  if (error) {
    throw new Error(await normalizeSupabaseError(error.message || fallbackMessage, fallbackMessage))
  }

  return (data ?? []) as T[]
}

async function getSingleRow<T>(
  promise: PromiseLike<unknown>,
  fallbackMessage: string,
): Promise<T | null> {
  let response: { data: T | null; error: { message: string } | null }

  try {
    response = (await promise) as { data: T | null; error: { message: string } | null }
  } catch (caughtError) {
    const rawMessage = caughtError instanceof Error ? caughtError.message : fallbackMessage
    throw new Error(await normalizeSupabaseError(rawMessage, fallbackMessage))
  }

  const { data, error } = response

  if (error) {
    throw new Error(await normalizeSupabaseError(error.message || fallbackMessage, fallbackMessage))
  }

  return data ?? null
}

async function throwIfSupabaseError(
  error: { message: string } | null,
  fallbackMessage: string,
) {
  if (!error) {
    return
  }

  throw new Error(await normalizeSupabaseError(error.message || fallbackMessage, fallbackMessage))
}

async function runMutation(
  promise: PromiseLike<unknown>,
  fallbackMessage: string,
) {
  let response: { error: { message: string } | null }

  try {
    response = (await promise) as { error: { message: string } | null }
  } catch (caughtError) {
    const rawMessage = caughtError instanceof Error ? caughtError.message : fallbackMessage
    throw new Error(await normalizeSupabaseError(rawMessage, fallbackMessage))
  }

  await throwIfSupabaseError(response.error, fallbackMessage)
}

async function runOptionalMutation(
  promise: PromiseLike<unknown>,
  fallbackMessage: string,
  tableName: string,
) {
  try {
    await runMutation(promise, fallbackMessage)
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message.toLowerCase() : ''
    const isMissingOptionalTable =
      message.includes(tableName.toLowerCase()) &&
      MISSING_SCHEMA_PATTERNS.some((pattern) => message.includes(pattern))

    if (!isMissingOptionalTable) {
      throw caughtError
    }
  }
}

function cleanText(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function cleanDate(value?: string | null) {
  return value ? value : null
}

function normalizeAmount(value: number | null | undefined) {
  return Number.isFinite(value) ? Number(value) : 0
}

function compactPayload<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as Partial<T>
}

async function createOrGetCliente(nome: string) {
  const clientName = nome.trim()
  if (!clientName) {
    throw new Error('Informe o nome do cliente.')
  }

  const existing = await getRows<ClienteSummary>(
    supabase.from('clientes').select('id,nome,email,empresa').eq('nome', clientName).limit(1),
    'Nao foi possivel procurar o cliente.',
  )

  if (existing[0]) {
    return existing[0].id
  }

  const created = await getSingleRow<ClienteSummary>(
    supabase.from('clientes').insert({ nome: clientName }).select('id,nome,email,empresa').single(),
    'Nao foi possivel criar o cliente.',
  )

  if (!created) {
    throw new Error('Nao foi possivel criar o cliente.')
  }

  return created.id
}

export async function fetchConfiguracoes(): Promise<ConfigMap> {
  const rows = await getRows<Configuracao>(
    supabase.from('configuracoes').select('chave,valor'),
    'Nao foi possivel carregar as configuracoes.',
  )
  return mapConfiguracoes(rows)
}

export async function fetchProjetos() {
  return getRows<Projeto>(
    supabase
      .from('projetos')
      .select(
        'id,cliente_id,titulo,descricao,tipo,valor_total,valor_pago,status,prazo,repo_url,staging_url,notas,criado_em,atualizado_em,clientes(id,nome,email,empresa)',
      )
      .order('prazo', { ascending: true, nullsFirst: false }),
    'Nao foi possivel carregar os projetos.',
  )
}

export async function fetchGastos() {
  try {
    return await getRows<Gasto>(
      supabase
        .from('gastos')
        .select(
          'id,descricao,valor,data,categoria_nome:categoria,recorrente,dia_vencimento,metodo,pago,notas,criado_em',
        )
        .order('data', { ascending: false }),
      'Nao foi possivel carregar os gastos.',
    )
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message.toLowerCase() : ''
    const canRetryLegacyColumn =
      message.includes('categoria') && MISSING_SCHEMA_PATTERNS.some((pattern) => message.includes(pattern))

    if (!canRetryLegacyColumn) {
      throw caughtError
    }

    return getRows<Gasto>(
      supabase
        .from('gastos')
        .select('id,descricao,valor,data,categoria_nome,recorrente,dia_vencimento,metodo,pago,notas,criado_em')
        .order('data', { ascending: false }),
      'Nao foi possivel carregar os gastos.',
    )
  }
}

export async function fetchReceitas() {
  return getRows<Receita>(
    supabase
      .from('receitas')
      .select('id,projeto_id,descricao,valor,data,origem,criado_em,projetos(id,titulo)')
      .order('data', { ascending: false }),
    'Nao foi possivel carregar as receitas.',
  )
}

export async function fetchInvestimentos() {
  return getRows<Investimento>(
    supabase
      .from('investimentos')
      .select('id,nome,tipo,meta_valor,meta_data,notas,ativo,criado_em')
      .order('criado_em', { ascending: false }),
    'Nao foi possivel carregar os investimentos.',
  )
}

export async function fetchAportes() {
  return getRows<Aporte>(
    supabase
      .from('aportes')
      .select('id,investimento_id,valor,data,tipo,notas,criado_em,investimentos(id,nome,tipo)')
      .order('data', { ascending: false }),
    'Nao foi possivel carregar os aportes.',
  )
}

export async function fetchTempoProjeto() {
  return getRows<TempoProjeto>(
    supabase
      .from('tempo_projeto')
      .select('id,projeto_id,inicio,fim,duracao_min,descricao,criado_em,projetos(id,titulo)')
      .order('inicio', { ascending: false }),
    'Nao foi possivel carregar as sessoes do timer.',
  )
}

export async function fetchDashboardSnapshot() {
  const [configuracoes, projetos, gastos, receitas, investimentos, aportes] = await Promise.all([
    fetchConfiguracoes(),
    fetchProjetos(),
    fetchGastos(),
    fetchReceitas(),
    fetchInvestimentos(),
    fetchAportes(),
  ])

  return { aportes, configuracoes, gastos, investimentos, projetos, receitas }
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

export async function startWorkSession(projetoId: number, descricao?: string) {
  const activeSessions = await getRows<{ id: number }>(
    supabase.from('tempo_projeto').select('id').is('fim', null).limit(1),
    'Nao foi possivel verificar a sessao ativa.',
  )

  if (activeSessions.length > 0) {
    throw new Error('Ja existe uma sessao ativa. Termine a sessao atual antes de iniciar outra.')
  }

  const { error } = await supabase.from('tempo_projeto').insert({
    descricao: descricao?.trim() || null,
    inicio: new Date().toISOString(),
    projeto_id: projetoId,
  })

  await throwIfSupabaseError(error, 'Nao foi possivel iniciar a sessao.')
}

export async function stopWorkSession(session: TempoProjeto, descricao?: string) {
  const end = new Date()
  const durationMinutes = Math.max(
    Math.floor((end.getTime() - new Date(session.inicio).getTime()) / 60000),
    0,
  )

  const { error } = await supabase
    .from('tempo_projeto')
    .update({
      descricao: descricao?.trim() || session.descricao || null,
      duracao_min: durationMinutes,
      fim: end.toISOString(),
    })
    .eq('id', session.id)

  await throwIfSupabaseError(error, 'Nao foi possivel encerrar a sessao.')
}

export async function saveConfiguracoes(values: ConfigMap) {
  const payload = Object.entries(values).map(([chave, valor]) => ({ chave, valor }))
  const { error } = await supabase.from('configuracoes').upsert(payload, { onConflict: 'chave' })

  await throwIfSupabaseError(error, 'Nao foi possivel salvar as configuracoes.')
}

export async function createProjeto(input: CreateProjetoInput) {
  const title = input.title.trim()
  if (!title) {
    throw new Error('Informe o titulo do projeto.')
  }

  const clientId = await createOrGetCliente(input.clientName)
  const payload = compactPayload({
    atualizado_em: new Date().toISOString(),
    cliente_id: clientId,
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

  await runMutation(
    supabase.from('projetos').insert(payload),
    'Nao foi possivel criar o projeto.',
  )
}

export async function updateProjetoStatus(projectId: number, status: string) {
  const nextStatus = cleanText(status)?.toLowerCase()
  if (!nextStatus) {
    throw new Error('Selecione um status valido.')
  }

  await runMutation(
    supabase
      .from('projetos')
      .update({
        atualizado_em: new Date().toISOString(),
        status: nextStatus,
      })
      .eq('id', projectId),
    'Nao foi possivel atualizar o status do projeto.',
  )
}

export async function deleteProjeto(projectId: number) {
  await runOptionalMutation(
    supabase.from('pagamentos').delete().eq('projeto_id', projectId),
    'Nao foi possivel remover os pagamentos do projeto.',
    'pagamentos',
  )
  await runMutation(
    supabase.from('receitas').delete().eq('projeto_id', projectId),
    'Nao foi possivel remover as receitas do projeto.',
  )
  await runMutation(
    supabase.from('tempo_projeto').delete().eq('projeto_id', projectId),
    'Nao foi possivel remover as sessoes do projeto.',
  )
  await runMutation(
    supabase.from('projetos').delete().eq('id', projectId),
    'Nao foi possivel remover o projeto.',
  )
}

export async function createGasto(input: CreateGastoInput) {
  const description = input.description.trim()
  if (!description) {
    throw new Error('Informe a descricao do gasto.')
  }

  if (!input.date) {
    throw new Error('Informe a data do gasto.')
  }

  if (normalizeAmount(input.value) <= 0) {
    throw new Error('O valor do gasto deve ser maior do que zero.')
  }

  const payload = compactPayload({
    categoria: cleanText(input.category),
    data: input.date,
    descricao: description,
    dia_vencimento: input.recurring ? input.dueDay ?? null : null,
    metodo: cleanText(input.method),
    notas: cleanText(input.notes),
    pago: input.paid === false ? 0 : 1,
    recorrente: input.recurring ? 1 : 0,
    valor: normalizeAmount(input.value),
  })

  await runMutation(
    supabase.from('gastos').insert(payload),
    'Nao foi possivel criar o gasto.',
  )
}

export async function deleteGasto(expenseId: number) {
  await runMutation(
    supabase.from('gastos').delete().eq('id', expenseId),
    'Nao foi possivel remover o gasto.',
  )
}

export async function createReceita(input: CreateReceitaInput) {
  const description = input.description.trim()
  if (!description) {
    throw new Error('Informe a descricao da receita.')
  }

  if (!input.date) {
    throw new Error('Informe a data da receita.')
  }

  if (normalizeAmount(input.value) <= 0) {
    throw new Error('O valor da receita deve ser maior do que zero.')
  }

  const payload = compactPayload({
    data: input.date,
    descricao: description,
    origem: cleanText(input.source),
    projeto_id: input.projectId ?? null,
    valor: normalizeAmount(input.value),
  })

  await runMutation(
    supabase.from('receitas').insert(payload),
    'Nao foi possivel criar a receita.',
  )
}

export async function deleteReceita(receiptId: number) {
  await runMutation(
    supabase.from('receitas').delete().eq('id', receiptId),
    'Nao foi possivel remover a receita.',
  )
}

export async function createInvestimento(input: CreateInvestimentoInput) {
  const name = input.name.trim()
  const type = input.type.trim()

  if (!name) {
    throw new Error('Informe o nome do investimento.')
  }

  if (!type) {
    throw new Error('Informe o tipo do investimento.')
  }

  const payload = compactPayload({
    ativo: input.active === false ? 0 : 1,
    meta_data: cleanDate(input.targetDate),
    meta_valor:
      input.targetValue === null || input.targetValue === undefined
        ? null
        : normalizeAmount(input.targetValue),
    nome: name,
    notas: cleanText(input.notes),
    tipo: type,
  })

  await runMutation(
    supabase.from('investimentos').insert(payload),
    'Nao foi possivel criar o investimento.',
  )
}

export async function deleteInvestimento(investmentId: number) {
  await runMutation(
    supabase.from('aportes').delete().eq('investimento_id', investmentId),
    'Nao foi possivel remover os movimentos do investimento.',
  )
  await runMutation(
    supabase.from('investimentos').delete().eq('id', investmentId),
    'Nao foi possivel remover o investimento.',
  )
}

export async function createAporte(input: CreateAporteInput) {
  if (!input.investmentId) {
    throw new Error('Selecione um investimento.')
  }

  if (!input.date) {
    throw new Error('Informe a data do movimento.')
  }

  if (normalizeAmount(input.value) <= 0) {
    throw new Error('O valor do movimento deve ser maior do que zero.')
  }

  const payload = compactPayload({
    data: input.date,
    investimento_id: input.investmentId,
    notas: cleanText(input.notes),
    tipo: cleanText(input.type)?.toLowerCase() ?? 'aporte',
    valor: normalizeAmount(input.value),
  })

  await runMutation(
    supabase.from('aportes').insert(payload),
    'Nao foi possivel registar o movimento.',
  )
}

export async function deleteAporte(contributionId: number) {
  await runMutation(
    supabase.from('aportes').delete().eq('id', contributionId),
    'Nao foi possivel remover o movimento.',
  )
}
