import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  action?: ReactNode
  description: string
  icon: LucideIcon
  tags?: string[]
  title: string
}

export function EmptyState({ action, description, icon: Icon, tags = [], title }: EmptyStateProps) {
  return (
    <div className="rounded-[28px] border border-dashed border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(10,10,10,0.98),rgba(4,4,4,0.98))] px-6 py-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-[var(--border-strong)] bg-[rgba(255,255,255,0.06)] text-[var(--brand)]">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{title}</h3>
      <p className="mx-auto mt-3 max-w-[640px] text-sm leading-6 text-[var(--text-secondary)]">{description}</p>

      {tags.length > 0 ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  )
}
