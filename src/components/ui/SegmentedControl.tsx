import type { ReactNode } from 'react'
import clsx from 'clsx'

interface Option<T extends string | number> {
  value: T
  label: ReactNode
  disabled?: boolean
}

interface Props<T extends string | number> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'
  ariaLabel?: string
}

/** タブ風の切り替えボタン群 */
export function SegmentedControl<T extends string | number>({ options, value, onChange, size = 'sm', ariaLabel }: Props<T>) {
  return (
    <div role="group" aria-label={ariaLabel} className="inline-flex items-center gap-1 bg-mahjong-panel border border-mahjong-border rounded-lg p-1">
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
              active ? 'bg-mahjong-gold text-black font-bold' : 'text-slate-300 hover:text-white hover:bg-mahjong-hover',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
