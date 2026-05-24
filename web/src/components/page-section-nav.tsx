import { NavLink } from 'react-router-dom'

interface PageSectionItem {
  label: string
  to: string
}

export function PageSectionNav({
  helper,
  items,
}: {
  helper?: string
  items: PageSectionItem[]
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-2 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                [
                  'rounded-[22px] px-4 py-3 text-sm font-medium transition',
                  isActive
                    ? 'bg-[var(--inverted-surface)] text-[var(--inverted-text)] shadow-[var(--shadow-soft)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      {helper ? <p className="px-1 text-sm text-[var(--text-secondary)]">{helper}</p> : null}
    </div>
  )
}
