interface NoticeBannerProps {
  message: string
}

export function NoticeBanner({ message }: NoticeBannerProps) {
  return (
    <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-primary)]">
      {message}
    </div>
  )
}
