import clsx from 'clsx'

interface Props {
  rank: number
  size?: 'sm' | 'md'
}

const RANK_STYLES: Record<number, string> = {
  1: 'bg-yellow-500 text-yellow-950',
  2: 'bg-slate-300 text-slate-900',
  3: 'bg-amber-700 text-amber-50',
  4: 'bg-red-800 text-red-100',
}

export function RankBadge({ rank, size = 'md' }: Props) {
  return (
    <span
      className={clsx(
        'font-bold rounded-full inline-block text-center whitespace-nowrap',
        RANK_STYLES[rank] ?? 'bg-slate-600 text-slate-200',
        size === 'sm' ? 'text-xs px-1.5 py-0.5 min-w-[2.5rem]' : 'text-sm px-2 py-0.5',
      )}
    >
      {rank}着
    </span>
  )
}
