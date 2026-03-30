import { AlertTriangle, CheckCircle2, CircleDashed, Clock3, XCircle } from 'lucide-react'

const STATUS_STYLES: Record<
  string,
  {
    className: string
    icon: typeof Clock3
  }
> = {
  cancelado: {
    className: 'border-[#4a1f2a] bg-[rgba(113,29,43,0.18)] text-[var(--color-danger)]',
    icon: XCircle,
  },
  concluido: {
    className: 'border-[#1f4a39] bg-[rgba(20,86,58,0.18)] text-[var(--color-success)]',
    icon: CheckCircle2,
  },
  em_andamento: {
    className: 'border-[#234a73] bg-[rgba(26,72,133,0.2)] text-[var(--color-info)]',
    icon: CircleDashed,
  },
  pago: {
    className: 'border-[#1f4a39] bg-[rgba(20,86,58,0.18)] text-[var(--color-success)]',
    icon: CheckCircle2,
  },
  pago_parcial: {
    className: 'border-[#5e3f84] bg-[rgba(118,72,194,0.18)] text-[var(--color-violet)]',
    icon: AlertTriangle,
  },
  pendente: {
    className: 'border-[#5a4722] bg-[rgba(140,96,15,0.18)] text-[var(--color-warning)]',
    icon: Clock3,
  },
}

export function StatusBadge({ status }: { status?: string | null }) {
  const normalized = (status ?? 'pendente').toLowerCase()
  const label = normalized.replaceAll('_', ' ')
  const style = STATUS_STYLES[normalized]
  const Icon = style?.icon ?? Clock3

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] ${
        style?.className ?? 'border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-secondary)]'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}
