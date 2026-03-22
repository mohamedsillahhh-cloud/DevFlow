import { type ConfigMap, type Relation, type Projeto, type TempoProjeto } from './types'

const LOCALE = 'pt-PT'

export const DEFAULT_CONFIG: ConfigMap = {
  alerta_conta_dias: '3',
  alerta_prazo_dias: '7',
  caminho_backup: '',
  moeda: 'CVE',
  nome_usuario: '',
  tema: 'preto',
  ultimo_backup: 'nunca',
  valor_hora_padrao: '0',
  valor_hora_projetos: '{}',
}

export const CURRENCY_OPTIONS = [
  { code: 'CVE', label: 'Escudo cabo-verdiano (CVE)' },
  { code: 'BRL', label: 'Real brasileiro (BRL)' },
  { code: 'USD', label: 'Dólar americano (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
]

export const BUTTON_PRIMARY =
  'inline-flex items-center justify-center rounded-xl border border-transparent bg-[#e94560] px-4 py-3 text-sm font-medium text-white shadow-[0_10px_30px_rgba(233,69,96,0.22)] transition hover:-translate-y-[1px] hover:bg-[#f25c74] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0'

export const BUTTON_SECONDARY =
  'inline-flex items-center justify-center rounded-xl border border-[#252529] bg-[#0b0b0d]/95 px-4 py-3 text-sm font-medium text-[#f0f0f0] shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition hover:-translate-y-[1px] hover:border-[#38383f] hover:bg-[#111114] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0'

export const INPUT_BASE =
  'w-full rounded-xl border border-[#252529] bg-[#0b0b0d]/95 px-4 py-3 text-sm text-[#f0f0f0] placeholder:text-[#4f4f56] transition focus:border-[#e94560] focus:ring-4 focus:ring-[#e94560]/10'

export function mapConfiguracoes(rows: Array<{ chave: string; valor: string }>): ConfigMap {
  return rows.reduce<ConfigMap>(
    (accumulator, item) => {
      accumulator[item.chave] = item.valor
      return accumulator
    },
    { ...DEFAULT_CONFIG },
  )
}

export function getRelationItem<T>(relation: Relation<T> | undefined): T | null {
  if (!relation) {
    return null
  }

  return Array.isArray(relation) ? (relation[0] ?? null) : relation
}

export function getClientName(project: Projeto) {
  return getRelationItem(project.clientes)?.nome ?? 'Sem cliente'
}

export function formatCurrency(value: number, currency = 'CVE') {
  const symbols: Record<string, string> = {
    BRL: 'R$',
    CVE: 'CVE',
    EUR: 'EUR',
    USD: '$',
  }
  const normalizedCurrency = currency.toUpperCase()
  const symbol = symbols[normalizedCurrency] ?? normalizedCurrency
  const formatted = value
    .toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  return `${symbol} ${formatted}`
}

export function formatDate(value: string | null | undefined, options?: Intl.DateTimeFormatOptions) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  }).format(new Date(value))
}

export function formatMonthLabel(value: Date) {
  return new Intl.DateTimeFormat(LOCALE, {
    month: 'long',
    year: 'numeric',
  }).format(value)
}

export function deadlineColor(value: string | null | undefined) {
  if (!value) {
    return '#378add'
  }

  const today = new Date()
  const target = new Date(value)
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diff = Math.floor((target.getTime() - today.getTime()) / 86400000)

  if (diff < 0) {
    return '#e24b4a'
  }
  if (diff <= 3) {
    return '#e94560'
  }
  if (diff <= 7) {
    return '#ef9f27'
  }
  return '#1d9e75'
}

export function formatPercent(partial: number, total: number) {
  if (!total) {
    return '0%'
  }
  return `${Math.round((partial / total) * 100)}%`
}

export function getMonthBounds(reference = new Date()) {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1)
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 1)
  return { start, end }
}

export function isWithinDateRange(value: string | null | undefined, start: Date, end: Date) {
  if (!value) {
    return false
  }

  const current = new Date(value)
  return current >= start && current < end
}

export function sumBy<T>(items: T[], selector: (item: T) => number, predicate?: (item: T) => boolean) {
  return items.reduce((accumulator, item) => {
    if (predicate && !predicate(item)) {
      return accumulator
    }
    return accumulator + selector(item)
  }, 0)
}

export function shiftMonth(reference: Date, offset: number) {
  return new Date(reference.getFullYear(), reference.getMonth() + offset, 1)
}

export function formatDurationMinutes(totalMinutes: number) {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return '0m'
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) {
    return `${minutes}m`
  }
  if (minutes === 0) {
    return `${hours}h`
  }
  return `${hours}h ${minutes}m`
}

export function formatClockDuration(session: Pick<TempoProjeto, 'inicio' | 'fim'>, now = new Date()) {
  const start = new Date(session.inicio)
  const finish = session.fim ? new Date(session.fim) : now
  const totalSeconds = Math.max(Math.floor((finish.getTime() - start.getTime()) / 1000), 0)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export function isOpenProject(project: Projeto) {
  return !['cancelado', 'concluido', 'pago'].includes((project.status ?? '').toLowerCase())
}

export function projectDueAmount(project: Projeto) {
  return Math.max((project.valor_total ?? 0) - (project.valor_pago ?? 0), 0)
}

export function sortProjectsByDeadline(projects: Projeto[]) {
  return [...projects].sort((left, right) => {
    if (!left.prazo && !right.prazo) {
      return 0
    }
    if (!left.prazo) {
      return 1
    }
    if (!right.prazo) {
      return -1
    }
    return new Date(left.prazo).getTime() - new Date(right.prazo).getTime()
  })
}

export function getSessionProjectTitle(session: TempoProjeto) {
  return getRelationItem(session.projetos)?.titulo ?? 'Projeto removido'
}

export function getUserDisplayName(config: ConfigMap, email?: string | null) {
  return config.nome_usuario?.trim() || email || 'DevFlow'
}

export function groupByMonth<T>(
  items: T[],
  getDate: (item: T) => string | null | undefined,
  getValue: (item: T) => number,
  months = 6,
) {
  return Array.from({ length: months }).map((_, index) => {
    const reference = shiftMonth(new Date(), -(months - index - 1))
    const { start, end } = getMonthBounds(reference)
    return {
      label: formatMonthLabel(reference),
      start,
      total: sumBy(items, getValue, (item) => isWithinDateRange(getDate(item), start, end)),
    }
  })
}

export function toSortedAlerts(
  projects: Projeto[],
  gastos: Array<{ data: string; descricao: string; pago: number; valor: number }>,
  config: ConfigMap,
  currency: string,
) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const prazoDays = parsePositiveInt(config.alerta_prazo_dias, 7)
  const contaDays = parsePositiveInt(config.alerta_conta_dias, 3)
  const alerts: Array<{ danger: boolean; message: string }> = []

  for (const project of sortProjectsByDeadline(projects)) {
    if (!project.prazo || !isOpenProject(project)) {
      continue
    }

    const due = projectDueAmount(project)
    if (due <= 0) {
      continue
    }

    const deadline = new Date(project.prazo)
    deadline.setHours(0, 0, 0, 0)
    const diff = Math.floor((deadline.getTime() - today.getTime()) / 86400000)

    if (diff < 0) {
      alerts.push({
        danger: true,
        message: `${project.titulo} (${getClientName(project)}): ${formatCurrency(
          due,
          currency,
        )} em atraso desde ${formatDate(project.prazo)}`,
      })
      continue
    }

    if (diff <= prazoDays) {
      alerts.push({
        danger: false,
        message: `${project.titulo} (${getClientName(project)}): ${formatCurrency(
          due,
          currency,
        )} pendente, prazo em ${diff} dias`,
      })
    }
  }

  for (const bill of gastos
    .filter((item) => item.pago === 0)
    .sort((left, right) => new Date(left.data).getTime() - new Date(right.data).getTime())) {
    const dueDate = new Date(bill.data)
    dueDate.setHours(0, 0, 0, 0)
    const diff = Math.floor((dueDate.getTime() - today.getTime()) / 86400000)
    if (diff <= contaDays) {
      alerts.push({
        danger: diff < 0,
        message: `${bill.descricao}: ${formatCurrency(bill.valor, currency)} pendente para ${formatDate(
          bill.data,
        )}`,
      })
    }
  }

  return alerts
}
