import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { EXPORT_PRESETS, getExportFilename, type ExportPreset, type ExportColumn } from '../lib/export/export'

describe('EXPORT_PRESETS', () => {
  it('defines receitas preset', () => {
    const preset = EXPORT_PRESETS.receitas
    expect(preset.columns).toBeDefined()
    expect(preset.columns.length).toBeGreaterThan(0)
    expect(preset.filename()).toBe('receitas')
  })

  it('defines gastos preset', () => {
    const preset = EXPORT_PRESETS.gastos
    expect(preset.columns).toBeDefined()
    expect(preset.columns.length).toBeGreaterThan(0)
  })

  it('defines projetos preset', () => {
    const preset = EXPORT_PRESETS.projetos
    expect(preset.columns).toBeDefined()
    expect(preset.columns.length).toBeGreaterThan(0)
  })

  it('defines investimentos preset', () => {
    const preset = EXPORT_PRESETS.investimentos
    expect(preset.columns).toBeDefined()
    expect(preset.columns.length).toBeGreaterThan(0)
  })

  it('defines aportes preset', () => {
    const preset = EXPORT_PRESETS.aportes
    expect(preset.columns).toBeDefined()
    expect(preset.columns.length).toBeGreaterThan(0)
  })

  it('defines sessoes preset', () => {
    const preset = EXPORT_PRESETS.sessoes
    expect(preset.columns).toBeDefined()
    expect(preset.columns.length).toBeGreaterThan(0)
  })

  it('includes suffix in filename', () => {
    expect(EXPORT_PRESETS.receitas.filename('2026-06')).toBe('receitas-2026-06')
  })

  it('preset data transforms values', () => {
    const preset = EXPORT_PRESETS.receitas
    const row = {
      data: '2026-06-27',
      descricao: 'Pagamento projeto',
      valor: 1500.5,
      origem: 'Freela',
    }
    const dataColumn = preset.columns.find((c) => c.key === 'data')
    expect(dataColumn?.value(row as never)).toMatch(/27/)
  })
})

describe('getExportFilename', () => {
  it('returns filename without suffix', () => {
    const preset: ExportPreset<unknown> = {
      columns: [],
      filename: () => 'test',
    }
    expect(getExportFilename(preset)).toBe('test')
  })

  it('returns filename with suffix', () => {
    const preset: ExportPreset<unknown> = {
      columns: [],
      filename: (suffix?: string) => `test-${suffix ?? ''}`,
    }
    expect(getExportFilename(preset, 'june')).toBe('test-june')
  })
})
