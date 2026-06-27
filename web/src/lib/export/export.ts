import type { Aporte, Gasto, Investimento, Projeto, Receita, TempoProjeto } from '../types'
import { formatDate, formatDurationMinutes, getClientName, getRelationItem, projectDueAmount } from '../format'

export type ExportFormat = 'csv' | 'xlsx'

export interface ExportColumn<Row> {
  key: string
  label: string
  value: (row: Row) => string | number | boolean | null | undefined
}

export interface ExportPreset<Row> {
  columns: ExportColumn<Row>[]
  filename: (suffix?: string) => string
}

function getExpenseCategoryLabel(gasto: Gasto) {
  return gasto.categoria_nome || 'Sem categoria'
}

export const EXPORT_PRESETS = {
  receitas: {
    columns: [
      { key: 'data', label: 'Data', value: (r: Receita) => formatDate(r.data) },
      { key: 'descricao', label: 'Descricao', value: (r: Receita) => r.descricao },
      { key: 'valor', label: 'Valor', value: (r: Receita) => r.valor.toFixed(2) },
      { key: 'origem', label: 'Origem', value: (r: Receita) => r.origem ?? '' },
      { key: 'projeto', label: 'Projeto', value: (r: Receita) => getRelationItem(r.projetos)?.titulo ?? '' },
    ],
    filename: (suffix?: string) => `receitas${suffix ? `-${suffix}` : ''}`,
  } satisfies ExportPreset<Receita>,

  gastos: {
    columns: [
      { key: 'data', label: 'Data', value: (r: Gasto) => formatDate(r.data) },
      { key: 'descricao', label: 'Descricao', value: (r: Gasto) => r.descricao },
      { key: 'categoria', label: 'Categoria', value: (r: Gasto) => getExpenseCategoryLabel(r) },
      { key: 'valor', label: 'Valor', value: (r: Gasto) => r.valor.toFixed(2) },
      { key: 'metodo', label: 'Metodo', value: (r: Gasto) => r.metodo ?? '' },
      { key: 'pago', label: 'Pago', value: (r: Gasto) => (r.pago === 1 ? 'Sim' : 'Não') },
    ],
    filename: (suffix?: string) => `gastos${suffix ? `-${suffix}` : ''}`,
  } satisfies ExportPreset<Gasto>,

  projetos: {
    columns: [
      { key: 'cliente', label: 'Cliente', value: (r: Projeto) => getClientName(r) },
      { key: 'projeto', label: 'Projeto', value: (r: Projeto) => r.titulo },
      { key: 'tipo', label: 'Tipo', value: (r: Projeto) => r.tipo ?? '' },
      { key: 'status', label: 'Status', value: (r: Projeto) => r.status ?? 'pendente' },
      { key: 'valor_total', label: 'Valor total', value: (r: Projeto) => (r.valor_total ?? 0).toFixed(2) },
      { key: 'valor_pago', label: 'Valor pago', value: (r: Projeto) => (r.valor_pago ?? 0).toFixed(2) },
      { key: 'em_aberto', label: 'Em aberto', value: (r: Projeto) => projectDueAmount(r).toFixed(2) },
      { key: 'prazo', label: 'Prazo', value: (r: Projeto) => formatDate(r.prazo) },
    ],
    filename: (suffix?: string) => `projetos${suffix ? `-${suffix}` : ''}`,
  } satisfies ExportPreset<Projeto>,

  investimentos: {
    columns: [
      { key: 'nome', label: 'Nome', value: (r: Investimento) => r.nome },
      { key: 'tipo', label: 'Tipo', value: (r: Investimento) => r.tipo },
      { key: 'ativo', label: 'Ativo', value: (r: Investimento) => (r.ativo === 1 ? 'Sim' : 'Nao') },
      { key: 'meta_valor', label: 'Meta valor', value: (r: Investimento) => (r.meta_valor ?? 0).toFixed(2) },
      { key: 'meta_data', label: 'Meta data', value: (r: Investimento) => formatDate(r.meta_data) },
    ],
    filename: (suffix?: string) => `investimentos${suffix ? `-${suffix}` : ''}`,
  } satisfies ExportPreset<Investimento>,

  aportes: {
    columns: [
      { key: 'data', label: 'Data', value: (r: Aporte) => formatDate(r.data) },
      { key: 'investimento', label: 'Investimento', value: (r: Aporte) => getRelationItem(r.investimentos)?.nome ?? '' },
      { key: 'tipo', label: 'Tipo', value: (r: Aporte) => r.tipo ?? 'aporte' },
      { key: 'valor', label: 'Valor', value: (r: Aporte) => r.valor.toFixed(2) },
      { key: 'notas', label: 'Notas', value: (r: Aporte) => r.notas ?? '' },
    ],
    filename: (suffix?: string) => `aportes${suffix ? `-${suffix}` : ''}`,
  } satisfies ExportPreset<Aporte>,

  sessoes: {
    columns: [
      { key: 'projeto', label: 'Projeto', value: (r: TempoProjeto) => getRelationItem(r.projetos)?.titulo ?? 'Projeto removido' },
      { key: 'inicio', label: 'Inicio', value: (r: TempoProjeto) => formatDate(r.inicio) },
      { key: 'fim', label: 'Fim', value: (r: TempoProjeto) => formatDate(r.fim) },
      { key: 'duracao', label: 'Duracao', value: (r: TempoProjeto) => formatDurationMinutes(r.duracao_min ?? 0) },
      { key: 'descricao', label: 'Descricao', value: (r: TempoProjeto) => r.descricao ?? '' },
    ],
    filename: (suffix?: string) => `sessoes-timer${suffix ? `-${suffix}` : ''}`,
  } satisfies ExportPreset<TempoProjeto>,
} as const

export type ExportType = keyof typeof EXPORT_PRESETS

function escapeCsvValue(value: string | number | boolean | null | undefined) {
  const serialized = value === null || value === undefined ? '' : String(value)
  if (serialized.includes('"') || serialized.includes(',') || serialized.includes('\n')) {
    return `"${serialized.replaceAll('"', '""')}"`
  }
  return serialized
}

export async function exportToCsv<Row>(
  preset: ExportPreset<Row>,
  data: Row[],
  suffix?: string,
): Promise<void> {
  const { columns, filename } = preset
  const csvLines = [
    columns.map((col) => escapeCsvValue(col.label)).join(','),
    ...data.map((row) => columns.map((col) => escapeCsvValue(col.value(row))).join(',')),
  ]
  const blob = new Blob([`\uFEFF${csvLines.join('\n')}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename(suffix)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function getExportFilename<Row>(preset: ExportPreset<Row>, suffix?: string): string {
  return preset.filename(suffix)
}

interface CsvColumn<Row> {
  label: string
  value: (row: Row) => string | number | boolean | null | undefined
}

export function downloadCsv<Row>(filename: string, columns: CsvColumn<Row>[], rows: Row[]) {
  const csvLines = [
    columns.map((column) => escapeCsvValue(column.label)).join(','),
    ...rows.map((row) => columns.map((column) => escapeCsvValue(column.value(row))).join(',')),
  ]

  const blob = new Blob([`\uFEFF${csvLines.join('\n')}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
