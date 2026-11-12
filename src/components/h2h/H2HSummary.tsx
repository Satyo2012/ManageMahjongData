import clsx from 'clsx'
import type { HeadToHeadStats } from '../../types'
import { compareBetter } from '../../domain/headToHead'
import { percent } from '../../domain/math'
import { formatPercent, formatSigned } from '../../utils/format'
import { H2H_COLORS } from '../../theme/chartTheme'

interface Metric {
  label: string
  a: number
  b: number
  format: (v: number) => string
  higherIsBetter: boolean
}

function metrics(h: HeadToHeadStats): Metric[] {
  return [
    { label: '平均着順', a: h.playerAAvgRank, b: h.playerBAvgRank, format: (v) => v.toFixed(2), higherIsBetter: false },
    { label: '平均スコア', a: h.playerAAvgScore, b: h.playerBAvgScore, format: (v) => formatSigned(v, 2), higherIsBetter: true },
    { label: '1着回数', a: h.playerAFirstCount, b: h.playerBFirstCount, format: (v) => `${v}回`, higherIsBetter: true },
    {
      label: '1着率（同卓時）',
      a: percent(h.playerAFirstCount, h.totalGames),
      b: percent(h.playerBFirstCount, h.totalGames),
      format: formatPercent,
      higherIsBetter: true,
    },
  ]
}

function WinColumn({ name, wins, rate, color }: { name: string; wins: number; rate: number; color: string }) {
  return (
    <div className="flex-1 text-center min-w-0">
      <p className="font-bold text-lg truncate" style={{ color }}>{name}</p>
      <p className="text-4xl font-bold text-white mt-1 tabular-nums">{wins}</p>
      <p className="text-slate-300 text-sm mt-1">{formatPercent(rate)}</p>
    </div>
  )
}

export function H2HSummary({ h2h }: { h2h: HeadToHeadStats }) {
  const total = Math.max(1, h2h.playerAWins + h2h.playerBWins)
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-slate-400 text-xs tracking-wider mb-1">同卓局数</p>
          <p className="text-4xl font-bold text-white tabular-nums">{h2h.totalGames}</p>
          <p className="text-slate-400 text-xs mt-1">局</p>
        </div>
        <div className="card p-4 md:col-span-2">
          <p className="text-slate-400 text-xs tracking-wider mb-3 text-center">対戦成績（相手より上の着順だった回数）</p>
          <div className="flex items-center gap-3">
            <WinColumn name={h2h.playerA} wins={h2h.playerAWins} rate={h2h.playerAWinRate} color={H2H_COLORS.a} />
            <div className="flex-1 h-3 rounded-full overflow-hidden flex bg-mahjong-panel" aria-hidden>
              <div style={{ width: `${(h2h.playerAWins / total) * 100}%`, backgroundColor: H2H_COLORS.a }} />
              <div style={{ width: `${(h2h.playerBWins / total) * 100}%`, backgroundColor: H2H_COLORS.b }} />
            </div>
            <WinColumn name={h2h.playerB} wins={h2h.playerBWins} rate={h2h.playerBWinRate} color={H2H_COLORS.b} />
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-bold text-sm text-slate-300 tracking-wider mb-4">スタッツ比較</h3>
        <div className="space-y-3">
          {metrics(h2h).map((m) => {
            const better = compareBetter(m.a, m.b, m.higherIsBetter)
            const cell = (side: 'a' | 'b', value: number) => (
              <div className={clsx('font-mono font-semibold', side === 'a' ? 'text-right' : 'text-left', better === side ? 'text-emerald-400' : 'text-slate-200')}>
                {better === side && <span className="mr-1">▲</span>}
                {m.format(value)}
              </div>
            )
            return (
              <div key={m.label} className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
                {cell('a', m.a)}
                <div className="text-center text-xs text-slate-400 w-28">{m.label}</div>
                {cell('b', m.b)}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
