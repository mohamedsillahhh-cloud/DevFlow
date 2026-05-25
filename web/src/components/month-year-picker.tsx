import { useMemo } from 'react'
import { cx } from '../lib/cn'

interface MonthYearPickerProps {
  monthLabel: string
  monthOptions: Array<{ label: string; value: number }>
  onSelectMonth: (month: number) => void
  onSelectYear: (year: number) => void
  selectedMonth: number
  selectedYear: number
  yearOptions: number[]
}

export function MonthYearPicker({
  monthLabel,
  monthOptions,
  onSelectMonth,
  onSelectYear,
  selectedMonth,
  selectedYear,
  yearOptions,
}: MonthYearPickerProps) {
  const today = new Date()
  const isCurrentMonth = (m: number) => today.getMonth() === m && today.getFullYear() === selectedYear
  const sortedYears = useMemo(() => [...yearOptions].sort((a, b) => a - b), [yearOptions])

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--text-secondary)]">
          {monthLabel}
        </p>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="flex items-center gap-2">
          {sortedYears.slice(0, 7).map((year) => {
            const isActive = year === selectedYear
            return (
              <button
                key={year}
                aria-pressed={isActive}
                className={cx(
                  'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-[var(--brand-soft)] text-[var(--brand)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                )}
                onClick={() => onSelectYear(year)}
                type="button"
              >
                {year}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-1">
        {monthOptions.map((option) => {
          const isActive = option.value === selectedMonth
          const isCurrent = isCurrentMonth(option.value)

          return (
            <button
              key={option.value}
              aria-pressed={isActive}
              className={cx(
                'relative rounded-md px-2 py-2 text-center text-sm font-medium transition sm:px-3',
                isActive
                  ? 'bg-[var(--brand)] text-[var(--inverted-text)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]',
              )}
              onClick={() => onSelectMonth(option.value)}
              type="button"
            >
              {option.label}
              {isCurrent && !isActive ? (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--brand)]" />
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
