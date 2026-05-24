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
        'relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[linear-gradient(180deg,var(--surface-2),var(--surface-1))] p-5 shadow-[var(--shadow-soft)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px]" style={{ backgroundColor: accent, opacity: 0.45 }} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(126,165,255,0.08),transparent_28%)]" />
      <div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-3 py-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
          <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
        </div>
        <p className="mt-4 text-[1.9rem] font-semibold text-[var(--text-primary)]">{value}</p>
        {subtitle ? <p className="mt-2 text-sm text-[var(--text-secondary)]">{subtitle}</p> : null}
      </div>
    </article>
  )
}
