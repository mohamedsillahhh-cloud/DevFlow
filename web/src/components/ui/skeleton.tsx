interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-[var(--surface-3)] ${className}`}
    />
  )
}

export function StatCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-[var(--shadow-panel)]">
      <div className="h-1 w-full bg-[var(--brand-soft)]" />
      <div className="p-5">
        <Skeleton className="mb-2 h-3 w-20" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-2 h-3 w-16" />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b border-[var(--border-subtle)]">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className={`h-4 ${i === 0 ? 'w-3/4' : 'w-1/2'}`} />
        </td>
      ))}
    </tr>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-panel)]">
        <Skeleton className="mb-4 h-6 w-36" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="mb-3 h-4 w-full" />
        ))}
      </div>
    </div>
  )
}
