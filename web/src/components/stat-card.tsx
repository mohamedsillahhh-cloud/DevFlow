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
        'relative overflow-hidden rounded-[28px] border border-[#1d1d21] bg-[linear-gradient(180deg,rgba(14,14,16,0.98),rgba(8,8,9,0.98))] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.25)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className="pointer-events-none absolute -right-6 top-0 h-24 w-24 rounded-full blur-3xl"
        style={{ backgroundColor: accent, opacity: 0.18 }}
      />
      <span
        className="absolute left-0 top-0 h-full w-1.5 rounded-full"
        style={{ backgroundColor: accent }}
      />
      <div className="pl-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.02] px-3 py-1">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#71717a]">{label}</p>
        </div>
        <p className="mt-5 text-[2rem] font-semibold tracking-[-0.05em] text-[#f0f0f0]">{value}</p>
        {subtitle ? <p className="mt-2 text-sm text-[#8a8a93]">{subtitle}</p> : null}
      </div>
    </article>
  )
}
