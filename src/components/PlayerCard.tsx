import type { PlayerStats } from '../types'

interface Props {
  stats: PlayerStats
  rank: number
  onClick: () => void
}

const PLACE_ICONS = ['🥇', '🥈', '🥉']

export function PlayerCard({ stats, rank, onClick }: Props) {
  const icon = rank <= 3 ? PLACE_ICONS[rank - 1] : `#${rank}`
  const scoreColor =
    stats.totalScore > 0 ? 'text-emerald-400' : stats.totalScore < 0 ? 'text-red-400' : 'text-slate-300'

  return (
    <button
      onClick={onClick}
      className="card p-5 text-left hover:border-[#d4af37]/60 hover:bg-[#243447] transition-all w-full group"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-2xl mr-2">{icon}</span>
          <span className="font-bold text-lg">{stats.name}</span>
        </div>
        <span className={`text-2xl font-bold ${scoreColor}`}>
          {stats.totalScore > 0 ? '+' : ''}
          {stats.totalScore.toFixed(1)}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { label: '1着', value: stats.firstRate, cls: 'text-yellow-400' },
          { label: '2着', value: stats.secondRate, cls: 'text-slate-300' },
          { label: '3着', value: stats.thirdRate, cls: 'text-amber-600' },
          { label: '4着', value: stats.fourthRate, cls: 'text-red-400' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="text-center">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`font-semibold text-sm ${cls}`}>{value.toFixed(1)}%</p>
          </div>
        ))}
      </div>

      <div className="flex justify-between text-xs text-slate-400 border-t border-[#2d4a6a] pt-2">
        <span>対局数: <span className="text-white font-medium">{stats.games}</span></span>
        <span>平均着順: <span className="text-white font-medium">{stats.avgRank.toFixed(2)}</span></span>
        <span>平均スコア: <span className="text-white font-medium">{stats.avgScore > 0 ? '+' : ''}{stats.avgScore.toFixed(2)}</span></span>
      </div>
    </button>
  )
}
