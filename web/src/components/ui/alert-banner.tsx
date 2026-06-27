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
        'flex items-center justify-between rounded-2xl border px-4 py-4 text-sm',
        danger
          ? 'border-[var(--alert-danger-border)] bg-[var(--alert-danger-bg)] text-[var(--text-primary)]'
          : 'border-[var(--alert-warning-border)] bg-[var(--alert-warning-bg)] text-[var(--text-primary)]',
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
