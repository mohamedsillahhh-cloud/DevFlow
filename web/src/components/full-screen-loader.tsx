export function FullScreenLoader({ label = 'A carregar...' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#000000] px-6">
      <div className="flex items-center gap-3 rounded-full border border-[#222222] bg-[#0d0d0d] px-5 py-3 text-sm text-[#888888] shadow-glow">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#e94560]" />
        {label}
      </div>
    </div>
  )
}
