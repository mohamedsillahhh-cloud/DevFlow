import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type EmptyVariant = 'default' | 'search' | 'chart'

interface EmptyStateProps {
  action?: ReactNode
  description: string
  icon: LucideIcon
  tags?: string[]
  title: string
  variant?: EmptyVariant
}

function EmptyIllustration({ variant }: { variant: EmptyVariant }) {
  if (variant === 'search') {
    return (
      <svg className="mb-4 h-16 w-16" fill="none" viewBox="0 0 64 64">
        <circle cx="28" cy="28" r="14" stroke="var(--border-strong)" strokeWidth="2" />
        <path d="M38 38l10 10" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="28" cy="28" r="6" stroke="var(--text-muted)" strokeWidth="1.5" />
      </svg>
    )
  }

  if (variant === 'chart') {
    return (
      <svg className="mb-4 h-16 w-16" fill="none" viewBox="0 0 64 64">
        <rect x="8" y="36" width="10" height="20" rx="2" fill="var(--color-accent-purple)" opacity="0.5" />
        <rect x="22" y="24" width="10" height="32" rx="2" fill="var(--color-accent-blue)" opacity="0.5" />
        <rect x="36" y="16" width="10" height="40" rx="2" fill="var(--color-accent-green)" opacity="0.5" />
        <rect x="50" y="28" width="8" height="28" rx="2" fill="var(--color-accent-orange)" opacity="0.5" />
        <line x1="8" y1="10" x2="8" y2="56" stroke="var(--border-strong)" strokeWidth="2" />
        <line x1="8" y1="56" x2="58" y2="56" stroke="var(--border-strong)" strokeWidth="2" />
      </svg>
    )
  }

  return null
}

export function EmptyState({
  action,
  description,
  icon: Icon,
  tags = [],
  title,
  variant,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(10,10,10,0.98),rgba(4,4,4,0.98))] px-6 py-10 text-center">
      {variant ? (
        <EmptyIllustration variant={variant} />
      ) : (
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-[var(--border-strong)] bg-[rgba(255,255,255,0.06)] text-[var(--brand)]">
          <Icon className="h-7 w-7" />
        </div>
      )}
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
