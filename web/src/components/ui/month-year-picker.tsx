import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cx } from '../../lib/cn'

interface MonthYearPickerProps {
  monthOptions: Array<{ label: string; value: number }>
  onSelectMonth: (month: number) => void
  onSelectYear: (year: number) => void
  selectedMonth: number
  selectedYear: number
  yearOptions: number[]
}

const VISIBLE_COUNT = 5

export function MonthYearPicker({
  monthOptions,
  onSelectMonth,
  onSelectYear,
  selectedMonth,
  selectedYear,
  yearOptions,
}: MonthYearPickerProps) {
  const today = new Date()
  const sortedYears = useMemo(() => [...yearOptions].sort((a, b) => a - b), [yearOptions])
  const maxStart = Math.max(0, sortedYears.length - VISIBLE_COUNT)
  const selectedIndex = sortedYears.indexOf(selectedYear)
  const [startIndex, setStartIndex] = useState(() =>
    selectedIndex >= 0 ? Math.min(selectedIndex, maxStart) : 0,
  )

  const visibleYears = sortedYears.slice(startIndex, startIndex + VISIBLE_COUNT)
  const canGoPrev = sortedYears.includes(selectedYear - 1)
  const canGoNext = sortedYears.includes(selectedYear + 1)

  const isCurrentMonth = (m: number) => today.getMonth() === m && today.getFullYear() === selectedYear

  function goToYear(year: number) {
    onSelectYear(year)
    const idx = sortedYears.indexOf(year)
    if (idx < startIndex) {
      setStartIndex(idx)
    } else if (idx >= startIndex + VISIBLE_COUNT) {
      setStartIndex(Math.min(idx - VISIBLE_COUNT + 1, maxStart))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1">
        <button
          aria-label="Ano anterior"
          className={cx(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-muted)] transition',
            canGoPrev
              ? 'hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
              : 'cursor-default opacity-30',
          )}
          disabled={!canGoPrev}
          onClick={() => goToYear(selectedYear - 1)}
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex flex-1 gap-1">
          {visibleYears.map((year) => {
            const isActive = year === selectedYear
            return (
              <button
                key={year}
                aria-pressed={isActive}
                className={cx(
                  'flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition',
                  isActive
                    ? 'bg-[var(--brand)] text-[var(--inverted-text)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]',
                )}
                onClick={() => goToYear(year)}
                type="button"
              >
                {year}
              </button>
            )
          })}
        </div>

        <button
          aria-label="Proximo ano"
          className={cx(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-muted)] transition',
            canGoNext
              ? 'hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
              : 'cursor-default opacity-30',
          )}
          disabled={!canGoNext}
          onClick={() => goToYear(selectedYear + 1)}
          type="button"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {monthOptions.map((option) => {
          const isActive = option.value === selectedMonth
          const isCurrent = isCurrentMonth(option.value)

          return (
            <button
              key={option.value}
              aria-pressed={isActive}
              className={cx(
                'relative rounded-xl px-2 py-3 text-center text-sm font-medium transition',
                isActive
                  ? 'bg-[var(--brand)] text-[var(--inverted-text)] shadow-sm'
                  : 'border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]',
              )}
              onClick={() => onSelectMonth(option.value)}
              type="button"
            >
              {option.label}
              {isCurrent && !isActive ? (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface-1)] bg-[var(--brand)]" />
              ) : null}
              {isActive ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand-strong)] text-[9px] text-[var(--inverted-text)]">
                  ✓
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
