import { useId, useState } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

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

interface CustomAreaTooltipProps {
  active?: boolean
  payload?: Array<{ color: string; name: string; value: number }>
  label?: string
  formatValue?: ((value: number) => string) | undefined
}

const CustomAreaTooltip = ({ active, payload, label, formatValue }: CustomAreaTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3 shadow-lg backdrop-blur">
        <p className="text-xs font-semibold text-[var(--text-primary)]">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-xs font-medium">
            {entry.name}: {formatValue ? formatValue(entry.value) : formatDefaultValue(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

interface CustomPieTooltipProps {
  active?: boolean
  payload?: Array<{ payload: { name: string; value: number } }>
  total: number
}

const CustomPieTooltip = ({ active, payload, total }: CustomPieTooltipProps) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload
    return (
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3 shadow-lg">
        <p className="text-xs font-semibold text-[var(--text-primary)]">{data.name}</p>
        <p className="text-xs text-[var(--text-secondary)]">{Math.round((data.value / total) * 100)}%</p>
      </div>
    )
  }
  return null
}

interface CustomBarTooltipProps {
  active?: boolean
  payload?: Array<{ payload: { label: string; value: number } }>
  maxValue: number
}

const CustomBarTooltip = ({ active, payload, maxValue }: CustomBarTooltipProps) => {
  if (active && payload && payload.length > 0) {
    const item = payload[0].payload
    return (
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3 shadow-lg">
        <p className="text-xs font-semibold text-[var(--text-primary)]">{item.label}</p>
        <p className="text-xs text-[var(--text-secondary)]">{Math.round((item.value / maxValue) * 100)}% do máximo</p>
      </div>
    )
  }
  return null
}

export function ComparisonAreaChart({
  data,
  formatValue = formatDefaultValue,
  primaryColor = DEFAULT_PRIMARY,
  primaryLabel = 'Receitas',
  secondaryColor = DEFAULT_SECONDARY,
  secondaryLabel = 'Gastos',
}: ComparisonAreaChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const chartId = useId().replaceAll(':', '')

  const chartData = data.map((item) => ({
    ...item,
    [primaryLabel]: item.primary,
    [secondaryLabel]: item.secondary,
  }))

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
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_36%),var(--surface-1)] p-4">
        <ResponsiveContainer height={320} width="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
            onMouseMove={(state) => {
              if (state.isTooltipActive && typeof state.activeTooltipIndex === 'number') {
                setActiveIndex(state.activeTooltipIndex)
              }
            }}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <defs>
              <linearGradient id={`${chartId}-primary`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.4} />
                <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
              </linearGradient>
              <linearGradient id={`${chartId}-secondary`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={secondaryColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={true} vertical={false} />
            <XAxis dataKey="label" stroke="var(--text-muted)" style={{ fontSize: '11px' }} tick={{ fill: 'var(--text-muted)' }} />
            <YAxis stroke="var(--text-muted)" style={{ fontSize: '11px' }} tick={{ fill: 'var(--text-muted)' }} />
            <Tooltip content={<CustomAreaTooltip formatValue={formatValue} />} />
            <Area
              type="monotone"
              dataKey={primaryLabel}
              stroke={primaryColor}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#${chartId}-primary)`}
              isAnimationActive={true}
              animationDuration={800}
              dot={{ fill: primaryColor, r: activeIndex !== null ? 5 : 3, strokeWidth: 2, stroke: 'var(--surface-1)' }}
              activeDot={{ r: 6, fill: primaryColor, stroke: 'var(--surface-1)', strokeWidth: 3 }}
            />
            <Area
              type="monotone"
              dataKey={secondaryLabel}
              stroke={secondaryColor}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#${chartId}-secondary)`}
              isAnimationActive={true}
              animationDuration={800}
              dot={{ fill: secondaryColor, r: activeIndex !== null ? 4 : 2.5, strokeWidth: 2, stroke: 'var(--surface-1)' }}
              activeDot={{ r: 6, fill: secondaryColor, stroke: 'var(--surface-1)', strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {data.map((item, index) => (
            <button
              key={item.label}
              className={['rounded-lg border px-3 py-2 text-left text-[10px] uppercase tracking-[0.22em] transition', activeIndex === index ? 'border-[var(--border-strong)] bg-[var(--surface-2)] text-[var(--text-primary)]' : 'border-transparent bg-transparent text-[var(--text-muted)] hover:border-[var(--border-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]'].join(' ')}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              type="button"
            >
              <span className="block truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function DonutChart({ centerLabel, centerValue, segments }: DonutChartProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const pieData = segments.map((seg) => ({
    name: seg.label,
    value: seg.value,
    color: seg.color,
    helper: seg.helper,
    displayValue: seg.displayValue,
  }))

  const total = segments.reduce((sum, seg) => sum + seg.value, 0)
  const activeSegment = segments[activeIndex]

  return (
    <div className="grid gap-6 lg:grid-cols-[220px,1fr] lg:items-center">
      <div className="relative mx-auto">
        <ResponsiveContainer height={240} width="100%">
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" onMouseEnter={(_, index) => setActiveIndex(index)}>
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} opacity={activeIndex === index ? 1 : 0.65} style={{ transition: 'opacity 0.3s ease' }} />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip total={total} />} />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[radial-gradient(circle,var(--surface-2),var(--surface-1))] px-5 text-center" style={{ width: '160px', height: '160px', margin: 'auto', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">{centerLabel}</span>
          <strong className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-[var(--text-primary)]">{centerValue}</strong>
          {activeSegment && (
            <div className="mt-3">
              <span className="block text-[10px] uppercase tracking-[0.24em]" style={{ color: activeSegment.color }}>
                {activeSegment.label}
              </span>
              <span className="mt-1 block font-mono text-xs text-[var(--text-secondary)]">{Math.round((activeSegment.value / total) * 100)}%</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {segments.map((segment, index) => {
          const isActive = activeIndex === index
          return (
            <button
              key={segment.label}
              className={['flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all duration-200', isActive ? 'border-[var(--border-strong)] bg-[var(--surface-1)]' : 'border-[var(--border-subtle)] bg-[var(--surface-2)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-1)]'].join(' ')}
              onFocus={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              type="button"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="h-3 w-3 rounded-full transition-transform duration-200" style={{ backgroundColor: segment.color, transform: isActive ? 'scale(1.25)' : 'scale(1)' }} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">{segment.label}</p>
                  {segment.helper ? <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{segment.helper}</p> : null}
                </div>
              </div>
              <span className="font-mono text-sm text-[var(--text-primary)]">{segment.displayValue ?? formatDefaultValue(segment.value)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function MiniBarChart({ data }: MiniBarChartProps) {
  const [activeIndex, setActiveIndex] = useState(data.length > 0 ? data.length - 1 : 0)
  const barGradientId = useId().replaceAll(':', '')

  const chartData = data.map((item, idx) => ({
    ...item,
    idx,
  }))

  const activeItem = data[activeIndex]
  const maxValue = Math.max(1, ...data.map((item) => item.value))

  return (
    <div className="space-y-4">
      {activeItem ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Categoria em foco</p>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">{activeItem.label}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{Math.round((activeItem.value / maxValue) * 100)}% da maior categoria</p>
            </div>
            <span className="font-mono text-sm text-[var(--text-primary)]">{activeItem.displayValue ?? formatDefaultValue(activeItem.value)}</span>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_36%),var(--surface-1)] p-4">
        <ResponsiveContainer height={240} width="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 30 }} onMouseMove={(state) => { if (state.isTooltipActive && typeof state.activeTooltipIndex === 'number') { setActiveIndex(state.activeTooltipIndex) } }} onMouseLeave={() => setActiveIndex(Math.max(0, data.length - 1))}>
            <defs>
              <linearGradient id={`${barGradientId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-info)" stopOpacity={1} />
                <stop offset="95%" stopColor="var(--color-info)" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="label" stroke="var(--text-muted)" style={{ fontSize: '11px' }} tick={{ fill: 'var(--text-muted)' }} />
            <YAxis stroke="var(--text-muted)" style={{ fontSize: '11px' }} tick={{ fill: 'var(--text-muted)' }} />
            <Tooltip content={<CustomBarTooltip maxValue={maxValue} />} />
            <Bar dataKey="value" fill={`url(#${barGradientId})`} radius={[12, 12, 0, 0]} isAnimationActive={true} animationDuration={600} onMouseEnter={(_, index) => setActiveIndex(index)}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || `url(#${barGradientId})`} opacity={activeIndex === index ? 1 : 0.65} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
