import { Gamepad2 } from 'lucide-react'
import type { PlayerStats } from '../../types'
import { formatPercent } from '../../utils/format'
import { PlayerName } from '../ui/PlayerName'
import { SignedValue } from '../ui/SignedValue'

interface Props {
  ranking: PlayerStats[]
  onSelectPlayer: (name: string) => void
}

const RATE_COLUMNS = [
  { label: '1着', key: 'firstRate', cls: 'text-yellow-400' },
  { label: '2着', key: 'secondRate', cls: 'text-slate-200' },
  { label: '3着', key: 'thirdRate', cls: 'text-amber-500' },
  { label: '4着', key: 'fourthRate', cls: 'text-red-400' },
  { label: '連帯率', key: 'top2Rate', cls: 'text-blue-400' },
  { label: '飛び率', key: 'flyingRate', cls: 'text-purple-400' },
] as const

export function RankingTable({ ranking, onSelectPlayer }: Props) {
  return (
    <section className="card p-5">
      <h2 className="section-title mb-4">
        <Gamepad2 className="w-5 h-5 text-mahjong-gold" />
        着順分布比較
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-300 text-xs border-b border-mahjong-border">
              <th className="text-left py-2 px-3">プレイヤー</th>
              <th className="text-right py-2 px-2">対局</th>
              <th className="text-right py-2 px-2">合計PT</th>
              <th className="text-right py-2 px-2">平均着</th>
              {RATE_COLUMNS.map((c) => (
                <th key={c.key} className="text-right py-2 px-2">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranking.map((s, i) => (
              <tr
                key={s.name}
                onClick={() => onSelectPlayer(s.name)}
                className="border-b border-mahjong-border/40 hover:bg-mahjong-hover cursor-pointer transition-colors"
              >
                <td className="py-2 px-3 font-medium whitespace-nowrap">
                  <span className="inline-block w-8 text-slate-400 tabular-nums">#{i + 1}</span>
                  <PlayerName name={s.name} />
                </td>
                <td className="py-2 px-2 text-right text-slate-200 tabular-nums">{s.games}</td>
                <td className="py-2 px-2 text-right font-semibold">
                  <SignedValue value={s.totalScore} />
                </td>
                <td className="py-2 px-2 text-right text-slate-200 tabular-nums">{s.avgRank.toFixed(2)}</td>
                {RATE_COLUMNS.map((c) => (
                  <td key={c.key} className={`py-2 px-2 text-right tabular-nums ${c.cls}`}>
                    {formatPercent(s[c.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
