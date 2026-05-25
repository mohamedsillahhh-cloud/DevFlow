import { Download, FileSpreadsheet, LoaderCircle } from 'lucide-react'
import { useRef, useState } from 'react'
import { EXPORT_PRESETS, exportToCsv, type ExportType } from '../lib/export'
import { exportToXlsx } from '../lib/excel'
import { cx } from '../lib/cn'

interface ExportDropdownProps<Row> {
  data: Row[]
  type: ExportType
  filename?: string
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
                <p className="text-[11px] text-[var(--text-muted)]">Formatado com cores e cabecalhos</p>
              </div>
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
