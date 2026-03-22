const STATUS_STYLES: Record<string, string> = {
  cancelado: 'border-[#3a161c] bg-[#14080b] text-[#e24b4a]',
  concluido: 'border-[#153127] bg-[#08130f] text-[#1d9e75]',
  em_andamento: 'border-[#173246] bg-[#09131a] text-[#378add]',
  pago: 'border-[#153127] bg-[#08130f] text-[#1d9e75]',
  pago_parcial: 'border-[#3d2800] bg-[#120d00] text-[#ef9f27]',
  pendente: 'border-[#3d2800] bg-[#120d00] text-[#ef9f27]',
}

export function StatusBadge({ status }: { status?: string | null }) {
  const normalized = (status ?? 'pendente').toLowerCase()
  const label = normalized.replaceAll('_', ' ')

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize tracking-[0.16em] ${
        STATUS_STYLES[normalized] ?? 'border-[#222222] bg-[#111111] text-[#888888]'
      }`}
    >
      {label}
    </span>
  )
}
