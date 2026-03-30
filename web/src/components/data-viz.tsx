import { useId } from 'react'

interface ComparisonAreaChartProps {
  data: Array<{
    label: string
    primary: number
    secondary: number
  }>
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
    helper?: string
    label: string
    value: number
  }>
}

interface MiniBarChartProps {
  data: Array<{
    color?: string
    label: string
    value: number
  }>
}

const DEFAULT_PRIMARY = 'var(--color-info)'
const DEFAULT_SECONDARY = 'var(--color-warning)'

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
  primaryColor = DEFAULT_PRIMARY,
  primaryLabel = 'Receitas',
  secondaryColor = DEFAULT_SECONDARY,
  secondaryLabel = 'Gastos',
}: ComparisonAreaChartProps) {
  const chartId = useId().replaceAll(':', '')
  const width = 100
  const height = 58
  const paddingX = 6
  const paddingY = 6
  const baseline = height - paddingY
  const maxValue = Math.max(1, ...data.flatMap((item) => [item.primary, item.secondary]))
  const stepX = data.length > 1 ? (width - paddingX * 2) / (data.length - 1) : 0

  const primaryPoints = data.map((item, index) => ({
    x: paddingX + stepX * index,
    y: baseline - (item.primary / maxValue) * (height - paddingY * 2),
  }))
  const secondaryPoints = data.map((item, index) => ({
    x: paddingX + stepX * index,
    y: baseline - (item.secondary / maxValue) * (height - paddingY * 2),
  }))

  return (
    <div className="space-y-4">
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

      <div className="overflow-hidden rounded-[28px] border border-[var(--border-subtle)] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_36%),var(--surface-1)] p-4">
        <svg aria-hidden="true" className="h-[260px] w-full" preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id={`${chartId}-primary`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={primaryColor} stopOpacity="0.34" />
              <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${chartId}-secondary`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.24" />
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

          <path d={buildAreaPath(secondaryPoints, baseline)} fill={`url(#${chartId}-secondary)`} />
          <path d={buildAreaPath(primaryPoints, baseline)} fill={`url(#${chartId}-primary)`} />
          <path d={buildLinePath(secondaryPoints)} fill="none" stroke={secondaryColor} strokeWidth="0.7" />
          <path d={buildLinePath(primaryPoints)} fill="none" stroke={primaryColor} strokeWidth="0.7" />

          {primaryPoints.map((point, index) => (
            <circle key={`primary-${data[index]?.label ?? index}`} cx={point.x} cy={point.y} fill={primaryColor} r="0.9" />
          ))}
          {secondaryPoints.map((point, index) => (
            <circle key={`secondary-${data[index]?.label ?? index}`} cx={point.x} cy={point.y} fill={secondaryColor} r="0.8" />
          ))}
        </svg>

        <div className="mt-4 grid gap-2 text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)] sm:grid-cols-6">
          {data.map((item) => (
            <div key={item.label} className="truncate">
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function DonutChart({ centerLabel, centerValue, segments }: DonutChartProps) {
  const total = Math.max(
    1,
    segments.reduce((accumulator, segment) => accumulator + segment.value, 0),
  )
  const radius = 42
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="grid gap-6 lg:grid-cols-[220px,1fr] lg:items-center">
      <div className="relative mx-auto h-[220px] w-[220px]">
        <svg aria-hidden="true" className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" fill="none" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="11" />
          {segments.map((segment) => {
            const ratio = segment.value / total
            const dash = circumference * ratio
            const currentOffset = offset
            offset += dash

            return (
              <circle
                key={segment.label}
                cx="60"
                cy="60"
                fill="none"
                r={radius}
                stroke={segment.color}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-currentOffset}
                strokeLinecap="round"
                strokeWidth="11"
              />
            )
          })}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[radial-gradient(circle,rgba(255,255,255,0.04),rgba(8,8,8,0.94))] text-center">
          <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">{centerLabel}</span>
          <strong className="mt-2 text-4xl font-semibold tracking-[-0.06em] text-[var(--text-primary)]">
            {centerValue}
          </strong>
        </div>
      </div>

      <div className="space-y-3">
        {segments.map((segment) => (
          <div
            key={segment.label}
            className="flex items-center justify-between rounded-[22px] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">{segment.label}</p>
                {segment.helper ? <p className="mt-1 text-xs text-[var(--text-secondary)]">{segment.helper}</p> : null}
              </div>
            </div>

            <span className="font-mono text-sm text-[var(--text-primary)]">{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MiniBarChart({ data }: MiniBarChartProps) {
  const maxValue = Math.max(1, ...data.map((item) => item.value))

  return (
    <div className="space-y-4">
      <div className="flex h-[240px] items-end gap-3">
        {data.map((item) => {
          const height = Math.max((item.value / maxValue) * 100, item.value > 0 ? 12 : 0)

          return (
            <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]">
                {item.value.toLocaleString('pt-PT')}
              </span>
              <div className="flex h-full w-full items-end rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-2">
                <div
                  className="w-full rounded-[18px] bg-[linear-gradient(180deg,rgba(108,156,255,0.95),rgba(42,88,194,0.58))] shadow-[0_18px_38px_rgba(52,104,255,0.22)]"
                  style={{
                    background: item.color ?? 'linear-gradient(180deg,rgba(108,156,255,0.95),rgba(42,88,194,0.58))',
                    height: `${height}%`,
                  }}
                />
              </div>
              <span className="max-w-full truncate text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                {item.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
