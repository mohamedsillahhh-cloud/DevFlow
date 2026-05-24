export function StatCard({
  className,
  label,
  subtitle,
  value,
}: {
  className?: string
  label: string
  subtitle?: string
  value: string
}) {
  return (
    <article
      className={[
        'group relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 transition hover:border-[var(--brand)]/40',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-[var(--brand)] opacity-40" />
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--text-secondary)]">{label}</p>
        <p className="mt-3 font-mono text-[28px] font-semibold leading-none tracking-tight text-[var(--text-primary)]">
          {value}
        </p>
        {subtitle ? <p className="mt-2 text-xs text-[var(--text-muted)]">{subtitle}</p> : null}
      </div>
    </article>
  )
}
