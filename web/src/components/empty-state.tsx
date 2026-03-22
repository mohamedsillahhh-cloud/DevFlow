import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  action?: ReactNode
  description: string
  icon: LucideIcon
  tags?: string[]
  title: string
}

export function EmptyState({ action, description, icon: Icon, tags = [], title }: EmptyStateProps) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#27272c] bg-[linear-gradient(180deg,rgba(11,11,13,0.96),rgba(8,8,9,0.96))] px-6 py-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-[#2a1a1f] bg-[#12080b] text-[#e94560]">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[#f0f0f0]">{title}</h3>
      <p className="mx-auto mt-3 max-w-[640px] text-sm leading-6 text-[#8a8a93]">{description}</p>

      {tags.length > 0 ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#24242a] bg-[#0d0d10] px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-[#777780]"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  )
}
