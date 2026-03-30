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
        'relative overflow-hidden rounded-[30px] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(12,12,12,0.98),rgba(5,5,5,0.98))] p-6 shadow-[var(--shadow-soft)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className="pointer-events-none absolute -right-8 top-0 h-28 w-28 rounded-full blur-3xl"
        style={{ backgroundColor: accent, opacity: 0.2 }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.03),transparent_24%)]" />
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-3 py-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">{label}</p>
        </div>
        <p className="mt-5 text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-primary)]">{value}</p>
        {subtitle ? <p className="mt-2 text-sm text-[var(--text-secondary)]">{subtitle}</p> : null}
      </div>
    </article>
  )
}
