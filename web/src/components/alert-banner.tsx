import { X } from 'lucide-react'
import { cx } from '../lib/cn'

interface AlertBannerProps {
  danger?: boolean
  message: string
  onClose?: () => void
}

export function AlertBanner({ danger, message, onClose }: AlertBannerProps) {
  return (
    <div
      className={cx(
        'flex items-center justify-between rounded-[24px] border px-4 py-4 text-sm',
        danger
          ? 'border-[#4a1f2a] bg-[rgba(113,29,43,0.16)] text-[var(--text-primary)]'
          : 'border-[#5a4722] bg-[rgba(140,96,15,0.16)] text-[var(--text-primary)]',
      )}
    >
      <span>{message}</span>
      {onClose ? (
        <button className="ml-3 shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]" onClick={onClose} type="button">
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}
