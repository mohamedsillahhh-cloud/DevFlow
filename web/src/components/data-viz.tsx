import { useId, useState } from 'react'

interface ComparisonAreaChartProps {
  data: Array<{
    label: string
    primary: number
    secondary: number
  }>
  formatValue?: (value: number) => string
  primaryColor?: string
  primaryLabel?: string
  secondaryColor?: string
  secondaryLabel?: string
}

interface DonutChartProps {
  centerLabel: string
  centerValue: string
  segments: Array<{
    color: string
    displayValue?: string
    helper?: string
    label: string
    value: number
  }>
}

interface MiniBarChartProps {
  data: Array<{
    color?: string
    displayValue?: string
    label: string
    value: number
  }>
}

const DEFAULT_PRIMARY = 'var(--color-info)'
const DEFAULT_SECONDARY = 'var(--color-warning)'

function formatDefaultValue(value: number) {
  return value.toLocaleString('pt-PT')
}

function buildLinePath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) {
    return ''
  }

  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
}

function buildAreaPath(points: Array<{ x: number; y: number }>, baseline: number) {
  if (points.length === 0) {
    return ''
  }

  const linePath = buildLinePath(points)
  const lastPoint = points[points.length - 1]
  const firstPoint = points[0]

  return `${linePath} L ${lastPoint.x} ${baseline} L ${firstPoint.x} ${baseline} Z`
}

export function ComparisonAreaChart({
  data,
  formatValue = formatDefaultValue,
  primaryColor = DEFAULT_PRIMARY,
  primaryLabel = 'Receitas',
  secondaryColor = DEFAULT_SECONDARY,
  secondaryLabel = 'Gastos',
}: ComparisonAreaChartProps) {
  const chartId = useId().replaceAll(':', '')
  const [activeIndex, setActiveIndex] = useState(data.length > 0 ? data.length - 1 : 0)
  const width = 100
  const height = 58
  const paddingX = 6
  const paddingY = 6
  const baseline = height - paddingY
  const maxValue = Math.max(1, ...data.flatMap((item) => [item.primary, item.secondary]))
  const stepX = data.length > 1 ? (width - paddingX * 2) / (data.length - 1) : 0
  const safeActiveIndex = data.length > 0 ? Math.min(activeIndex, data.length - 1) : 0

  const primaryPoints = data.map((item, index) => ({
    x: paddingX + stepX * index,
    y: baseline - (item.primary / maxValue) * (height - paddingY * 2),
  }))
  const secondaryPoints = data.map((item, index) => ({
    x: paddingX + stepX * index,
    y: baseline - (item.secondary / maxValue) * (height - paddingY * 2),
  }))

  const activeEntry = data[safeActiveIndex]
  const activePrimaryPoint = primaryPoints[safeActiveIndex]
  const activeSecondaryPoint = secondaryPoints[safeActiveIndex]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
            {primaryLabel}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
            {secondaryLabel}
          </div>
        </div>

        {activeEntry ? (
          <div className="inline-flex items-center gap-3 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-2 text-xs text-[var(--text-secondary)]">
            <span className="uppercase tracking-[0.24em] text-[var(--text-muted)]">{activeEntry.label}</span>
            <span className="font-mono text-[var(--text-primary)]">{formatValue(activeEntry.primary)}</span>
            <span className="font-mono text-[var(--text-primary)]">{formatValue(activeEntry.secondary)}</span>
          </div>
        ) : null}
      </div>

      <div className="relative overflow-hidden rounded-[28px] border border-[var(--border-subtle)] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_36%),var(--surface-1)] p-4">
        {activeEntry && activePrimaryPoint && activeSecondaryPoint ? (
          <div className="pointer-events-none absolute right-4 top-4 z-10 hidden min-w-[220px] rounded-[20px] border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.72)] px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.34)] backdrop-blur md:block">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">{activeEntry.label}</p>
            <div className="mt-3 grid gap-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="inline-flex items-center gap-2 text-[var(--text-secondary)]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                  {primaryLabel}
                </span>
                <span className="font-mono text-[var(--text-primary)]">{formatValue(activeEntry.primary)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="inline-flex items-center gap-2 text-[var(--text-secondary)]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
                  {secondaryLabel}
                </span>
                <span className="font-mono text-[var(--text-primary)]">{formatValue(activeEntry.secondary)}</span>
              </div>
            </div>
          </div>
        ) : null}

        <svg aria-hidden="true" className="h-[280px] w-full" preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id={`${chartId}-primary`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={primaryColor} stopOpacity="0.36" />
              <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${chartId}-secondary`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.22" />
              <stop offset="100%" stopColor={secondaryColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3].map((line) => {
            const y = paddingY + ((height - paddingY * 2) / 3) * line
            return (
              <line
                key={line}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="1.5 3"
                strokeWidth="0.3"
                x1={paddingX}
                x2={width - paddingX}
                y1={y}
                y2={y}
              />
            )
          })}

          {activePrimaryPoint ? (
            <line
              stroke="rgba(255,255,255,0.14)"
              strokeDasharray="1.5 2.2"
              strokeWidth="0.32"
              x1={activePrimaryPoint.x}
              x2={activePrimaryPoint.x}
              y1={paddingY}
              y2={baseline}
            />
          ) : null}

          <path d={buildAreaPath(secondaryPoints, baseline)} fill={`url(#${chartId}-secondary)`} />
          <path d={buildAreaPath(primaryPoints, baseline)} fill={`url(#${chartId}-primary)`} />
          <path d={buildLinePath(secondaryPoints)} fill="none" stroke={secondaryColor} strokeWidth="0.78" />
          <path d={buildLinePath(primaryPoints)} fill="none" stroke={primaryColor} strokeWidth="0.86" />

          {primaryPoints.map((point, index) => {
            const isActive = index === safeActiveIndex

            return (
              <g key={`primary-${data[index]?.label ?? index}`}>
                {isActive ? <circle cx={point.x} cy={point.y} fill={primaryColor} opacity="0.18" r="3.2" /> : null}
                <circle cx={point.x} cy={point.y} fill={primaryColor} r={isActive ? '1.35' : '0.95'} />
              </g>
            )
          })}
          {secondaryPoints.map((point, index) => {
            const isActive = index === safeActiveIndex

            return (
              <g key={`secondary-${data[index]?.label ?? index}`}>
                {isActive ? <circle cx={point.x} cy={point.y} fill={secondaryColor} opacity="0.18" r="3" /> : null}
                <circle cx={point.x} cy={point.y} fill={secondaryColor} r={isActive ? '1.2' : '0.8'} />
              </g>
            )
          })}

          {data.map((item, index) => {
            const point = primaryPoints[index]
            const leftBoundary = index === 0 ? paddingX : point.x - stepX / 2
            const rightBoundary = index === data.length - 1 ? width - paddingX : point.x + stepX / 2
            const zoneWidth = data.length > 1 ? Math.max(rightBoundary - leftBoundary, 6) : width - paddingX * 2

            return (
              <rect
                key={`zone-${item.label}`}
                fill="transparent"
                height={height}
                onMouseEnter={() => setActiveIndex(index)}
                width={zoneWidth}
                x={leftBoundary}
                y={0}
              />
            )
          })}
        </svg>

        <div className="mt-4 grid gap-2 sm:grid-cols-6">
          {data.map((item, index) => {
            const isActive = index === safeActiveIndex

            return (
              <button
                key={item.label}
                className={[
                  'rounded-[18px] border px-3 py-2 text-left text-[10px] uppercase tracking-[0.22em] transition',
                  isActive
                    ? 'border-[rgba(255,255,255,0.18)] bg-[var(--surface-2)] text-[var(--text-primary)]'
                    : 'border-transparent bg-transparent text-[var(--text-muted)] hover:border-[var(--border-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]',
                ].join(' ')}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                type="button"
              >
                <span className="block truncate">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function DonutChart({ centerLabel, centerValue, segments }: DonutChartProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const total = Math.max(
    1,
    segments.reduce((accumulator, segment) => accumulator + segment.value, 0),
  )
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const safeActiveIndex = segments.length > 0 ? Math.min(activeIndex, segments.length - 1) : 0

  const segmentsWithOffsets = segments.map((segment, index) => {
    const previousDash = segments
      .slice(0, index)
      .reduce((accumulator, currentSegment) => accumulator + circumference * (currentSegment.value / total), 0)

    return {
      dash: circumference * (segment.value / total),
      offset: previousDash,
      ratio: segment.value / total,
      ...segment,
    }
  })

  const activeSegment = segmentsWithOffsets[safeActiveIndex]

  return (
    <div className="grid gap-6 lg:grid-cols-[220px,1fr] lg:items-center">
      <div className="relative mx-auto h-[220px] w-[220px]">
        <svg aria-hidden="true" className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" fill="none" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="11" />
          {segmentsWithOffsets.map((segment, index) => {
            const isActive = index === safeActiveIndex

            return (
              <circle
                key={segment.label}
                cx="60"
                cy="60"
                fill="none"
                onMouseEnter={() => setActiveIndex(index)}
                r={radius}
                stroke={segment.color}
                strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
                strokeDashoffset={-segment.offset}
                strokeLinecap="round"
                strokeOpacity={isActive ? 1 : 0.58}
                strokeWidth={isActive ? '12' : '10.5'}
              />
            )
          })}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[radial-gradient(circle,rgba(255,255,255,0.04),rgba(8,8,8,0.94))] px-5 text-center">
          <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">{centerLabel}</span>
          <strong className="mt-2 text-4xl font-semibold tracking-[-0.06em] text-[var(--text-primary)]">
            {centerValue}
          </strong>
          {activeSegment ? (
            <>
              <span className="mt-3 text-[11px] uppercase tracking-[0.24em]" style={{ color: activeSegment.color }}>
                {activeSegment.label}
              </span>
              <span className="mt-1 font-mono text-sm text-[var(--text-secondary)]">
                {Math.round(activeSegment.ratio * 100)}%
              </span>
            </>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        {activeSegment ? (
          <div className="rounded-[22px] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Segmento em foco</p>
            <div className="mt-3 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{activeSegment.label}</p>
                {activeSegment.helper ? (
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{activeSegment.helper}</p>
                ) : null}
              </div>
              <span className="font-mono text-sm text-[var(--text-primary)]">
                {activeSegment.displayValue ?? formatDefaultValue(activeSegment.value)}
              </span>
            </div>
          </div>
        ) : null}

        {segments.map((segment, index) => {
          const isActive = index === safeActiveIndex

          return (
            <button
              key={segment.label}
              className={[
                'flex w-full items-center justify-between rounded-[22px] border px-4 py-3 text-left transition',
                isActive
                  ? 'border-[rgba(255,255,255,0.18)] bg-[var(--surface-1)]'
                  : 'border-[var(--border-subtle)] bg-[var(--surface-2)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-1)]',
              ].join(' ')}
              onFocus={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              type="button"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">{segment.label}</p>
                  {segment.helper ? <p className="mt-1 text-xs text-[var(--text-secondary)]">{segment.helper}</p> : null}
                </div>
              </div>

              <span className="font-mono text-sm text-[var(--text-primary)]">
                {segment.displayValue ?? formatDefaultValue(segment.value)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function MiniBarChart({ data }: MiniBarChartProps) {
  const [activeIndex, setActiveIndex] = useState(data.length > 0 ? data.length - 1 : 0)
  const maxValue = Math.max(1, ...data.map((item) => item.value))
  const safeActiveIndex = data.length > 0 ? Math.min(activeIndex, data.length - 1) : 0
  const activeItem = data[safeActiveIndex]

  return (
    <div className="space-y-4">
      {activeItem ? (
        <div className="rounded-[22px] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Barra em foco</p>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">{activeItem.label}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {Math.round((activeItem.value / maxValue) * 100)}% da maior barra do conjunto.
              </p>
            </div>
            <span className="font-mono text-sm text-[var(--text-primary)]">
              {activeItem.displayValue ?? formatDefaultValue(activeItem.value)}
            </span>
          </div>
        </div>
      ) : null}

      <div className="flex h-[240px] items-end gap-3">
        {data.map((item, index) => {
          const height = Math.max((item.value / maxValue) * 100, item.value > 0 ? 12 : 0)
          const isActive = index === safeActiveIndex

          return (
            <button
              key={item.label}
              className="flex min-w-0 flex-1 flex-col items-center gap-3 bg-transparent p-0 text-left"
              onFocus={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              type="button"
            >
              <span
                className={[
                  'text-[10px] font-medium uppercase tracking-[0.2em] transition',
                  isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]',
                ].join(' ')}
              >
                {item.displayValue ?? formatDefaultValue(item.value)}
              </span>
              <div
                className={[
                  'flex h-full w-full items-end rounded-[24px] border p-2 transition',
                  isActive
                    ? 'border-[rgba(255,255,255,0.18)] bg-[var(--surface-1)]'
                    : 'border-[var(--border-subtle)] bg-[var(--surface-2)]',
                ].join(' ')}
              >
                <div
                  className={[
                    'w-full rounded-[18px] shadow-[0_18px_38px_rgba(52,104,255,0.22)] transition',
                    isActive ? 'scale-y-100 opacity-100' : 'opacity-78',
                  ].join(' ')}
                  style={{
                    background: item.color ?? 'linear-gradient(180deg,rgba(108,156,255,0.95),rgba(42,88,194,0.58))',
                    height: `${height}%`,
                    transform: isActive ? 'scale(1)' : 'scale(0.96)',
                    transformOrigin: 'bottom',
                  }}
                />
              </div>
              <span
                className={[
                  'max-w-full truncate text-[10px] uppercase tracking-[0.2em] transition',
                  isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]',
                ].join(' ')}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
