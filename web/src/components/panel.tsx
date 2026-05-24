import type { ReactNode } from 'react'

interface PanelProps {
  actions?: ReactNode
  children?: ReactNode
  className?: string
  description?: string
  title?: string
}

export function Panel({ actions, children, className, description, title }: PanelProps) {
  return (
    <section
      className={[
        'rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {(title || description || actions) && (
        <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? (
              <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      )}
      <div>{children}</div>
    </section>
  )
}
