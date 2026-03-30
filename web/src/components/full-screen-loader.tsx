export function FullScreenLoader({ label = 'A carregar...' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-canvas)] px-6">
      <div className="flex items-center gap-3 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-5 py-3 text-sm text-[var(--text-secondary)] shadow-[var(--shadow-soft)]">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--brand)]" />
        {label}
      </div>
    </div>
  )
}
