export function StatCard({
  accent,
  className,
  label,
  subtitle,
  value,
}: {
  accent: string
  className?: string
  label: string
  subtitle?: string
  value: string
}) {
  return (
    <article
      className={[
        'group relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[3px]" style={{ backgroundColor: accent }} />
      <div className="pl-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-secondary)]">{label}</p>
        <p className="mt-2 font-mono text-2xl font-semibold leading-none tracking-tight sm:text-[28px]" style={{ color: accent }}>
          {value}
        </p>
        {subtitle ? <p className="mt-2 text-xs text-[var(--text-muted)]">{subtitle}</p> : null}
      </div>
    </article>
  )
}
