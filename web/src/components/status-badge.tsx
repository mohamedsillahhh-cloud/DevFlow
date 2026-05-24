import { AlertTriangle, CheckCircle2, CircleDashed, Clock3, XCircle } from 'lucide-react'

const STATUS_STYLES: Record<
  string,
  {
    className: string
    icon: typeof Clock3
  }
> = {
  cancelado: {
    className: 'bg-[rgba(255,71,87,0.12)] text-[var(--color-danger)]',
    icon: XCircle,
  },
  concluido: {
    className: 'bg-[rgba(0,212,170,0.12)] text-[var(--color-success)]',
    icon: CheckCircle2,
  },
  em_andamento: {
    className: 'bg-[rgba(108,99,255,0.12)] text-[var(--color-info)]',
    icon: CircleDashed,
  },
  pago: {
    className: 'bg-[rgba(0,212,170,0.12)] text-[var(--color-success)]',
    icon: CheckCircle2,
  },
  pago_parcial: {
    className: 'bg-[rgba(155,138,255,0.12)] text-[var(--color-violet)]',
    icon: AlertTriangle,
  },
  pendente: {
    className: 'bg-[rgba(255,165,0,0.12)] text-[var(--color-warning)]',
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
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${
        style?.className ?? 'bg-[var(--surface-2)] text-[var(--text-secondary)]'
      }`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}
