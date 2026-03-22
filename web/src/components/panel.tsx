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
        'relative overflow-hidden rounded-[28px] border border-[#1d1d21] bg-[linear-gradient(180deg,rgba(16,16,18,0.98),rgba(10,10,11,0.98))] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.38)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e94560]/40 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full bg-[#e94560]/[0.08] blur-3xl" />

      {(title || description || actions) && (
        <header className="relative mb-5 flex flex-col gap-3 border-b border-[#17171b] pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? (
              <h2 className="text-sm font-semibold uppercase tracking-[0.28em] text-[#8d8d97]">{title}</h2>
            ) : null}
            {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-[#66666d]">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      )}
      <div className="relative">{children}</div>
    </section>
  )
}
