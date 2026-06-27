import { Download, FileSpreadsheet, FileText, LoaderCircle, PieChart } from 'lucide-react'
import { useRef, useState } from 'react'
import { EXPORT_PRESETS, exportToCsv, type ExportType } from '../../lib/export/export'
import { exportToXlsx, exportToXlsxCompleto } from '../../lib/export/excel'
import { exportToPdfCompleto } from '../../lib/export/pdf'
import { cx } from '../../lib/cn'
import type { Gasto, Projeto, Receita, TempoProjeto } from '../../lib/types'

interface ExportDropdownProps<Row> {
  data: Row[]
  type: ExportType
  filename?: string
  label?: string
}

interface ExportCompletoProps {
  projetos: Projeto[]
  gastos: Gasto[]
  receitas: Receita[]
  sessoes: TempoProjeto[]
  label?: string
}

export function ExportDropdown<Row>({ data, type, filename, label = 'Exportar' }: ExportDropdownProps<Row>) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState<'csv' | 'xlsx' | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadingRef = useRef<'csv' | 'xlsx' | null>(null)

  async function handleExport(format: 'csv' | 'xlsx') {
    if (loadingRef.current) return
    loadingRef.current = format
    setIsLoading(format)
    setIsOpen(false)

    try {
      const preset = EXPORT_PRESETS[type]
      if (format === 'csv') {
        await exportToCsv(preset as never, data as never, filename)
      } else {
        await exportToXlsx(preset as never, data as never, filename)
      }
    } finally {
      loadingRef.current = null
      timeoutRef.current = setTimeout(() => setIsLoading(null), 600)
    }
  }

  return (
    <div className="relative">
      <button
        className={cx(
          'inline-flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition',
          isLoading
            ? 'cursor-not-allowed border-[var(--border-subtle)]/50 text-[var(--text-muted)]'
            : 'border-[var(--border-subtle)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-2)]',
        )}
        disabled={!!isLoading}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        {isLoading ? (
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        {isLoading === 'csv' ? 'A gerar CSV...' : isLoading === 'xlsx' ? 'A gerar Excel...' : label}
      </button>

      {isOpen ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-lg">
            <button
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--text-primary)] transition hover:bg-[var(--surface-2)]"
              onClick={() => handleExport('csv')}
              type="button"
            >
              <FileSpreadsheet className="h-4 w-4 text-[var(--color-info)]" />
              <div>
                <p className="font-medium">CSV</p>
                <p className="text-[11px] text-[var(--text-muted)]">Abrir em Excel ou Sheets</p>
              </div>
            </button>
            <div className="border-t border-[var(--border-subtle)]" />
            <button
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--text-primary)] transition hover:bg-[var(--surface-2)]"
              onClick={() => handleExport('xlsx')}
              type="button"
            >
              <FileSpreadsheet className="h-4 w-4 text-[var(--color-success)]" />
              <div>
                <p className="font-medium">Excel (.xlsx)</p>
                <p className="text-[11px] text-[var(--text-muted)]">Formatado com resumos</p>
              </div>
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}

export function ExportCompleto({ projetos, gastos, receitas, sessoes, label = 'Exportar' }: ExportCompletoProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState<'xlsx' | 'pdf' | null>(null)
  const loadingRef = useRef<'xlsx' | 'pdf' | null>(null)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  })

  function filterByDateRange<T>(items: T[], getDate: (item: T) => string): T[] {
    if (!dateRange.start && !dateRange.end) return items
    return items.filter((item) => {
      const itemDate = getDate(item)
      if (dateRange.start && itemDate < dateRange.start) return false
      if (dateRange.end && itemDate > dateRange.end) return false
      return true
    })
  }

  async function handleExport(format: 'xlsx' | 'pdf') {
    if (loadingRef.current) return
    loadingRef.current = format
    setIsLoading(format)
    setIsOpen(false)

    try {
      if (dateRange.start && dateRange.end && dateRange.start > dateRange.end) {
        window.alert('A data inicial nao pode ser maior que a data final.')
        return
      }

      const filteredProjetos = projetos
      const filteredGastos = filterByDateRange(gastos, (item) => item.data)
      const filteredReceitas = filterByDateRange(receitas, (item) => item.data)
      const filteredSessoes = filterByDateRange(sessoes, (item) => item.inicio.slice(0, 10))

      const stamp = dateRange.start || dateRange.end
        ? `${dateRange.start || ''}-${dateRange.end || ''}`
        : new Date().toISOString().slice(0, 10)

      if (format === 'xlsx') {
        await exportToXlsxCompleto(filteredProjetos, filteredGastos, filteredReceitas, filteredSessoes, stamp)
      } else {
        await exportToPdfCompleto(filteredProjetos, filteredGastos, filteredReceitas, filteredSessoes, stamp)
      }
    } catch (error) {
      console.error('Falha ao exportar relatorio completo:', error)
      window.alert('Nao foi possivel gerar o relatorio. Tente novamente.')
    } finally {
      loadingRef.current = null
      setTimeout(() => setIsLoading(null), 600)
    }
  }

  return (
    <div className="relative inline-flex items-center gap-2">
      <input
        type="date"
        value={dateRange.start}
        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
        className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text-primary)]"
        title="Data inicial"
      />
      <span className="text-xs text-[var(--text-muted)]">a</span>
      <input
        type="date"
        value={dateRange.end}
        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
        className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text-primary)]"
        title="Data final"
      />
      <div className="relative">
        <button
          className={cx(
            'inline-flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition',
            isLoading
              ? 'cursor-not-allowed border-[var(--border-subtle)]/50 text-[var(--text-muted)]'
              : 'border-[var(--border-subtle)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-2)]',
          )}
          disabled={!!isLoading}
          onClick={() => setIsOpen(!isOpen)}
          type="button"
        >
          {isLoading ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PieChart className="mr-2 h-4 w-4" />
          )}
          {isLoading === 'xlsx' ? 'A gerar Excel...' : isLoading === 'pdf' ? 'A gerar PDF...' : label}
        </button>

        {isOpen ? (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 z-20 mt-1 min-w-[200px] overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-lg">
              <button
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--text-primary)] transition hover:bg-[var(--surface-2)]"
                onClick={() => handleExport('xlsx')}
                type="button"
              >
                <FileSpreadsheet className="h-4 w-4 text-[var(--color-success)]" />
                <div>
                  <p className="font-medium">Excel Completo (.xlsx)</p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Lucro/prejuízo + resumos + todas as abas
                  </p>
                </div>
              </button>
              <div className="border-t border-[var(--border-subtle)]" />
              <button
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--text-primary)] transition hover:bg-[var(--surface-2)]"
                onClick={() => handleExport('pdf')}
                type="button"
              >
                <FileText className="h-4 w-4 text-[var(--color-danger)]" />
                <div>
                  <p className="font-medium">PDF</p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Relatório formatado para impressão
                  </p>
                </div>
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
