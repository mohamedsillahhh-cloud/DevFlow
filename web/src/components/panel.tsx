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
        'relative overflow-hidden rounded-[32px] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(10,10,10,0.98),rgba(4,4,4,0.98))] p-5 shadow-[var(--shadow-panel)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.035),transparent_24%)]" />

      {(title || description || actions) && (
        <header className="relative mb-5 flex flex-col gap-3 border-b border-[var(--border-subtle)] pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? (
              <h2 className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--text-secondary)]">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      )}
      <div className="relative">{children}</div>
    </section>
  )
}
