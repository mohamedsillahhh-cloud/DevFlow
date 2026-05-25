import { cx } from '../lib/cn'

interface PaginationProps {
  currentPage: number
  hasMore: boolean
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, hasMore, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-center gap-3 pt-4">
      <button
        className={cx(
          'rounded-lg border px-3 py-1.5 text-sm transition',
          currentPage > 0
            ? 'border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--surface-2)]'
            : 'cursor-not-allowed border-[var(--border-subtle)]/50 text-[var(--text-muted)]',
        )}
        disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}
        type="button"
      >
        Anterior
      </button>
      <span className="text-sm text-[var(--text-muted)]">Página {currentPage + 1}</span>
      <button
        className={cx(
          'rounded-lg border px-3 py-1.5 text-sm transition',
          hasMore
            ? 'border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--surface-2)]'
            : 'cursor-not-allowed border-[var(--border-subtle)]/50 text-[var(--text-muted)]',
        )}
        disabled={!hasMore}
        onClick={() => onPageChange(currentPage + 1)}
        type="button"
      >
        Seguinte
      </button>
    </div>
  )
}
