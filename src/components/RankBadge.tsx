import clsx from 'clsx'

interface Props {
  rank: number
  size?: 'sm' | 'md' | 'lg'
}

const RANK_STYLES = {
  1: 'bg-yellow-500 text-yellow-900',
  2: 'bg-slate-400 text-slate-900',
  3: 'bg-amber-700 text-amber-100',
  4: 'bg-red-900 text-red-300',
}

const RANK_LABELS = { 1: '1位', 2: '2位', 3: '3位', 4: '4位' }

export function RankBadge({ rank, size = 'md' }: Props) {
  const style = RANK_STYLES[rank as keyof typeof RANK_STYLES] ?? 'bg-slate-600 text-slate-200'
  const label = RANK_LABELS[rank as keyof typeof RANK_LABELS] ?? `${rank}位`
  return (
    <span
      className={clsx(
        'font-bold rounded-full inline-block text-center',
        style,
        size === 'sm' && 'text-xs px-1.5 py-0.5',
        size === 'md' && 'text-sm px-2 py-0.5',
        size === 'lg' && 'text-base px-3 py-1',
      )}
    >
      {label}
    </span>
  )
}
