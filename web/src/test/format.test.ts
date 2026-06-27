import { describe, expect, it } from 'vitest'
import {
  formatCurrency,
  formatDurationMinutes,
  formatPercent,
  isOpenProject,
  projectDueAmount,
  formatRatio,
  formatCoverage,
  parseDateValue,
  formatDate,
  formatInputDateValue,
  formatMonthLabel,
  getRelationItem,
  getClientName,
  formatClockDuration,
  parsePositiveInt,
  deadlineColor,
  mapConfiguracoes,
  getMonthBounds,
  isWithinDateRange,
  sumBy,
  shiftMonth,
  sortProjectsByDeadline,
  getSessionProjectTitle,
  getUserDisplayName,
  groupByMonth,
  toSortedAlerts,
} from '../lib/format'
import type { Projeto, TempoProjeto, ConfigMap, Gasto } from '../lib/types'

describe('formatCurrency', () => {
  it('formats CVE currency', () => {
    expect(formatCurrency(1500.5, 'CVE')).toBe('CVE 1.500,50')
  })

  it('formats USD currency', () => {
    expect(formatCurrency(99.99, 'USD')).toBe('$ 99,99')
  })

  it('formats EUR currency', () => {
    expect(formatCurrency(1200, 'EUR')).toBe('EUR 1.200,00')
  })

  it('handles zero', () => {
    expect(formatCurrency(0, 'CVE')).toBe('CVE 0,00')
  })
})

describe('formatDurationMinutes', () => {
  it('formats only minutes', () => {
    expect(formatDurationMinutes(45)).toBe('45m')
  })

  it('formats hours and minutes', () => {
    expect(formatDurationMinutes(150)).toBe('2h 30m')
  })

  it('formats exact hours', () => {
    expect(formatDurationMinutes(120)).toBe('2h')
  })

  it('handles zero or negative', () => {
    expect(formatDurationMinutes(0)).toBe('0m')
    expect(formatDurationMinutes(-5)).toBe('0m')
  })
})

describe('formatPercent', () => {
  it('calculates percentage', () => {
    expect(formatPercent(50, 200)).toBe('25%')
  })

  it('handles zero total', () => {
    expect(formatPercent(50, 0)).toBe('0%')
  })
})

describe('isOpenProject', () => {
  const baseProject = { status: 'pendente' } as Projeto

  it('returns true for pending projects', () => {
    expect(isOpenProject({ ...baseProject, status: 'pendente' })).toBe(true)
  })

  it('returns false for cancelled projects', () => {
    expect(isOpenProject({ ...baseProject, status: 'cancelado' })).toBe(false)
  })

  it('returns false for completed projects', () => {
    expect(isOpenProject({ ...baseProject, status: 'concluido' })).toBe(false)
  })

  it('returns false for paid projects', () => {
    expect(isOpenProject({ ...baseProject, status: 'pago' })).toBe(false)
  })
})

describe('projectDueAmount', () => {
  it('calculates remaining amount', () => {
    expect(projectDueAmount({ valor_total: 1000, valor_pago: 300 } as Projeto)).toBe(700)
  })

  it('returns 0 when fully paid', () => {
    expect(projectDueAmount({ valor_total: 1000, valor_pago: 1000 } as Projeto)).toBe(0)
  })

  it('handles null values', () => {
    expect(projectDueAmount({ valor_total: null, valor_pago: null } as Projeto)).toBe(0)
  })
})

describe('formatRatio', () => {
  it('formats positive ratio', () => {
    expect(formatRatio(0.25)).toBe('25%')
  })

  it('formats negative ratio', () => {
    expect(formatRatio(-0.3)).toBe('-30%')
  })

  it('formats zero', () => {
    expect(formatRatio(0)).toBe('0%')
  })

  it('formats integer ratio', () => {
    expect(formatRatio(1)).toBe('100%')
  })

  it('handles non-finite values', () => {
    expect(formatRatio(Infinity)).toBe('0%')
    expect(formatRatio(NaN)).toBe('0%')
  })
})

describe('formatCoverage', () => {
  it('formats positive coverage', () => {
    expect(formatCoverage(3.5)).toBe('3,5 meses')
  })

  it('formats negative coverage', () => {
    expect(formatCoverage(-1.25)).toBe('-1,3 meses')
  })

  it('formats zero coverage', () => {
    expect(formatCoverage(0)).toBe('0,0 meses')
  })

  it('handles non-finite values', () => {
    expect(formatCoverage(Infinity)).toBe('0,0 meses')
    expect(formatCoverage(NaN)).toBe('0,0 meses')
  })
})

describe('parseDateValue', () => {
  it('parses ISO date string', () => {
    const result = parseDateValue('2026-06-27')
    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(5)
    expect(result.getDate()).toBe(27)
  })

  it('returns current date for null', () => {
    const now = new Date()
    const result = parseDateValue(null)
    expect(result.getTime() - now.getTime()).toBeLessThan(100)
  })

  it('returns current date for undefined', () => {
    const now = new Date()
    const result = parseDateValue(undefined)
    expect(result.getTime() - now.getTime()).toBeLessThan(100)
  })

  it('clones a Date instance', () => {
    const original = new Date('2026-06-27')
    const result = parseDateValue(original)
    expect(result.getTime()).toBe(original.getTime())
  })

  it('handles invalid date strings by returning current date', () => {
    const result = parseDateValue('not-a-date')
    expect(result).toBeInstanceOf(Date)
  })
})

describe('formatDate', () => {
  it('returns dash for null', () => {
    expect(formatDate(null)).toBe('-')
  })

  it('returns dash for undefined', () => {
    expect(formatDate(undefined)).toBe('-')
  })

  it('formats a date string', () => {
    expect(formatDate('2026-06-27')).toBe('27/06/2026')
  })

  it('formats a Date object', () => {
    expect(formatDate(new Date(2026, 5, 27))).toBe('27/06/2026')
  })
})

describe('formatInputDateValue', () => {
  it('formats current date by default', () => {
    const result = formatInputDateValue()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('formats a specific date', () => {
    expect(formatInputDateValue(new Date(2026, 5, 27))).toBe('2026-06-27')
  })

  it('pads month and day with zeros', () => {
    expect(formatInputDateValue(new Date(2026, 0, 1))).toBe('2026-01-01')
  })
})

describe('formatMonthLabel', () => {
  it('formats month label in Portuguese', () => {
    expect(formatMonthLabel(new Date(2026, 5, 1))).toBe('junho de 2026')
  })

  it('handles January', () => {
    expect(formatMonthLabel(new Date(2026, 0, 1))).toBe('janeiro de 2026')
  })
})

describe('getRelationItem', () => {
  it('returns null for undefined', () => {
    expect(getRelationItem(undefined)).toBe(null)
  })

  it('returns null for null', () => {
    expect(getRelationItem(null)).toBe(null)
  })

  it('returns the item from a single relation', () => {
    const item = { id: 1, nome: 'Test' }
    expect(getRelationItem(item)).toBe(item)
  })

  it('returns first item from an array relation', () => {
    const items = [{ id: 1, nome: 'First' }, { id: 2, nome: 'Second' }]
    expect(getRelationItem(items)).toBe(items[0])
  })

  it('returns null from empty array', () => {
    expect(getRelationItem([])).toBe(null)
  })
})

describe('getClientName', () => {
  it('returns client nome when client exists', () => {
    const project = { clientes: { nome: 'João Silva' } } as Projeto
    expect(getClientName(project)).toBe('João Silva')
  })

  it('returns fallback when no client', () => {
    expect(getClientName({} as Projeto)).toBe('Sem cliente')
  })
})

describe('formatClockDuration', () => {
  it('formats a session with start and end', () => {
    const session = {
      inicio: '2026-06-27T10:00:00',
      fim: '2026-06-27T12:30:15',
    } as TempoProjeto
    expect(formatClockDuration(session)).toBe('02:30:15')
  })

  it('formats an active session (no end)', () => {
    const session = { inicio: '2026-06-27T10:00:00', fim: null } as TempoProjeto
    const later = new Date('2026-06-27T10:45:30')
    expect(formatClockDuration(session, later)).toBe('00:45:30')
  })
})

describe('parsePositiveInt', () => {
  it('parses a valid positive integer', () => {
    expect(parsePositiveInt('42', 0)).toBe(42)
  })

  it('returns fallback for undefined', () => {
    expect(parsePositiveInt(undefined, 10)).toBe(10)
  })

  it('returns fallback for negative', () => {
    expect(parsePositiveInt('-5', 10)).toBe(10)
  })

  it('returns fallback for non-numeric', () => {
    expect(parsePositiveInt('abc', 10)).toBe(10)
  })
})

describe('deadlineColor', () => {
  it('returns blue for null', () => {
    expect(deadlineColor(null)).toBe('var(--color-deadline-none)')
  })

  it('returns red for overdue dates', () => {
    const past = '2020-01-01'
    expect(deadlineColor(past)).toBe('var(--color-deadline-overdue)')
  })

  it('returns green for far future', () => {
    const future = '2030-01-01'
    expect(deadlineColor(future)).toBe('var(--color-deadline-far)')
  })
})

describe('mapConfiguracoes', () => {
  it('maps rows to ConfigMap', () => {
    const rows = [
      { chave: 'moeda', valor: 'USD' },
      { chave: 'nome_usuario', valor: 'Test' },
    ]
    const result = mapConfiguracoes(rows)
    expect(result.moeda).toBe('USD')
    expect(result.nome_usuario).toBe('Test')
  })

  it('preserves defaults for missing keys', () => {
    expect(mapConfiguracoes([]).moeda).toBe('CVE')
  })
})

describe('getMonthBounds', () => {
  it('returns correct start and end for a month', () => {
    const { start, end } = getMonthBounds(new Date(2026, 5, 15))
    expect(start.getTime()).toBe(new Date(2026, 5, 1).getTime())
    expect(end.getTime()).toBe(new Date(2026, 6, 1).getTime())
  })
})

describe('isWithinDateRange', () => {
  it('returns true for date within range', () => {
    expect(isWithinDateRange('2026-06-15', new Date(2026, 5, 1), new Date(2026, 6, 1))).toBe(true)
  })

  it('returns false for outside range', () => {
    expect(isWithinDateRange('2026-07-15', new Date(2026, 5, 1), new Date(2026, 6, 1))).toBe(false)
  })

  it('returns false for null value', () => {
    expect(isWithinDateRange(null, new Date(2026, 5, 1), new Date(2026, 6, 1))).toBe(false)
  })
})

describe('sumBy', () => {
  const items = [
    { category: 'a', value: 10 },
    { category: 'b', value: 20 },
    { category: 'a', value: 30 },
  ]

  it('sums without predicate', () => {
    expect(sumBy(items, (item) => item.value)).toBe(60)
  })

  it('sums with predicate', () => {
    expect(sumBy(items, (item) => item.value, (item) => item.category === 'a')).toBe(40)
  })

  it('returns 0 for empty array', () => {
    expect(sumBy([], (item: { value: number }) => item.value)).toBe(0)
  })
})

describe('shiftMonth', () => {
  it('shifts forward by one month', () => {
    const result = shiftMonth(new Date(2026, 5, 15), 1)
    expect(result.getMonth()).toBe(6)
  })

  it('shifts backward by one month', () => {
    const result = shiftMonth(new Date(2026, 5, 15), -1)
    expect(result.getMonth()).toBe(4)
  })
})

describe('sortProjectsByDeadline', () => {
  it('sorts by deadline ascending', () => {
    const projects = [
      { prazo: '2026-12-31' },
      { prazo: '2026-06-15' },
      { prazo: '2026-09-01' },
    ] as Projeto[]
    const sorted = sortProjectsByDeadline(projects)
    expect(sorted[0].prazo).toBe('2026-06-15')
    expect(sorted[1].prazo).toBe('2026-09-01')
    expect(sorted[2].prazo).toBe('2026-12-31')
  })

  it('places projects without deadline at the end', () => {
    const projects = [
      { prazo: '2026-12-31' },
      { prazo: null },
      { prazo: '2026-06-15' },
    ] as Projeto[]
    const sorted = sortProjectsByDeadline(projects)
    expect(sorted[0].prazo).toBe('2026-06-15')
    expect(sorted[1].prazo).toBe('2026-12-31')
    expect(sorted[2].prazo).toBeNull()
  })
})

describe('getSessionProjectTitle', () => {
  it('returns project title when relation exists', () => {
    const session = { projetos: { titulo: 'Website' } } as TempoProjeto
    expect(getSessionProjectTitle(session)).toBe('Website')
  })

  it('returns fallback for removed project', () => {
    expect(getSessionProjectTitle({} as TempoProjeto)).toBe('Projeto removido')
  })
})

describe('getUserDisplayName', () => {
  it('returns config name', () => {
    expect(getUserDisplayName({ nome_usuario: 'João' })).toBe('João')
  })

  it('returns email fallback', () => {
    expect(getUserDisplayName({ nome_usuario: '' }, 'joao@email.com')).toBe('joao@email.com')
  })

  it('returns default fallback', () => {
    expect(getUserDisplayName({ nome_usuario: '' }, null)).toBe('DevFlow')
  })
})

describe('groupByMonth', () => {
  it('groups items by month', () => {
    const items = [
      { date: '2026-06-15', value: 100 },
      { date: '2026-06-20', value: 200 },
      { date: '2026-07-10', value: 300 },
    ]
    const groups = groupByMonth(items, (item) => item.date, (item) => item.value, 2)
    expect(groups).toHaveLength(2)
  })
})

describe('toSortedAlerts', () => {
  it('alerts on overdue projects', () => {
    const projects = [
      { titulo: 'Proj A', prazo: '2020-01-01', clientes: { nome: 'Client X' }, valor_total: 1000, valor_pago: 0, status: 'pendente' },
    ] as Projeto[]
    const gastos: Gasto[] = []
    const config: ConfigMap = { alerta_prazo_dias: '7', alerta_conta_dias: '3' }
    const alerts = toSortedAlerts(projects, gastos, config, 'CVE')
    expect(alerts.length).toBeGreaterThan(0)
    expect(alerts[0].danger).toBe(true)
  })
})
