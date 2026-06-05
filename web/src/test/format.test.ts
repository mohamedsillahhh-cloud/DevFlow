import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDurationMinutes, formatPercent, isOpenProject, projectDueAmount } from '../lib/format'
import type { Projeto } from '../lib/types'

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
