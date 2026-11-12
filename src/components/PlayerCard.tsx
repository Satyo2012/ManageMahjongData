import type { PlayerStats } from '../types'
import { formatPercent, formatSigned } from '../utils/format'
import { PlayerName } from './ui/PlayerName'
import { SignedValue } from './ui/SignedValue'

interface Props {
  stats: PlayerStats
  rank: number
  onClick: () => void
}

const PLACE_ICONS = ['🥇', '🥈', '🥉']

const RATE_ITEMS = [
  { label: '1着', key: 'firstRate', cls: 'text-yellow-400' },
  { label: '2着', key: 'secondRate', cls: 'text-slate-200' },
  { label: '3着', key: 'thirdRate', cls: 'text-amber-500' },
  { label: '4着', key: 'fourthRate', cls: 'text-red-400' },
] as const

export function PlayerCard({ stats, rank, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card p-4 text-left hover:border-mahjong-gold/60 hover:bg-mahjong-hover transition-colors w-full"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl w-8 text-center shrink-0 text-slate-400 font-bold">
            {rank <= PLACE_ICONS.length ? PLACE_ICONS[rank - 1] : `#${rank}`}
          </span>
          <PlayerName name={stats.name} className="font-bold text-lg" />
        </div>
        <SignedValue value={stats.totalScore} className="text-2xl font-bold shrink-0" />
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        {RATE_ITEMS.map(({ label, key, cls }) => (
          <div key={label} className="text-center">
            <p className="text-xs text-slate-400">{label}</p>
            <p className={`font-semibold text-sm ${cls}`}>{formatPercent(stats[key])}</p>
          </div>
        ))}
      </div>

      <dl className="grid grid-cols-3 gap-2 text-xs border-t border-mahjong-border pt-2">
        {[
          ['対局数', `${stats.games}`],
          ['平均着順', stats.avgRank.toFixed(2)],
          ['平均スコア', formatSigned(stats.avgScore, 2)],
        ].map(([label, value]) => (
          <div key={label} className="text-center">
            <dt className="text-slate-400">{label}</dt>
            <dd className="text-white font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </button>
  )
}
