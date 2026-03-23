import { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import type { PlayerStats } from '../types'

interface Props {
  stats: PlayerStats
  color?: string
}

const WINDOWS = [10, 20, 30, 50] as const

export function RollingWinRateChart({ stats, color = '#d4af37' }: Props) {
  const [windowSize, setWindowSize] = useState<number>(20)

  const data = useMemo(() => {
    const ranks = stats.rankHistory
    if (ranks.length < windowSize) return []

    return ranks.slice(windowSize - 1).map((_, offset) => {
      const i = offset + windowSize - 1
      const slice = ranks.slice(i - windowSize + 1, i + 1)
      const first = slice.filter((r) => r === 1).length
      const top2 = slice.filter((r) => r <= 2).length
      const fourth = slice.filter((r) => r === 4).length
      const avgRank = slice.reduce((a, b) => a + b, 0) / windowSize

      return {
        game: stats.gameIndices[i],
        '1着率': Math.round((first / windowSize) * 1000) / 10,
        'トップ率': Math.round((top2 / windowSize) * 1000) / 10,
        '4着率': Math.round((fourth / windowSize) * 1000) / 10,
        '平均着順': Math.round(avgRank * 100) / 100,
      }
    })
  }, [stats, windowSize])

  if (stats.games < 10) {
    return (
      <p className="text-slate-500 text-sm text-center py-6">
        ローリング平均の表示には10局以上必要です（現在 {stats.games} 局）
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {/* ウィンドウ選択 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">直近</span>
        {WINDOWS.map((w) => (
          <button
            key={w}
            onClick={() => setWindowSize(w)}
            disabled={stats.games < w}
            className={`px-2.5 py-1 rounded text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
              windowSize === w
                ? 'bg-[#d4af37] text-black font-bold'
                : 'card hover:border-[#d4af37]/50 text-slate-400'
            }`}
          >
            {w}局
          </button>
        ))}
        <span className="text-xs text-slate-400">の移動平均</span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d4a6a" />
          <XAxis
            dataKey="game"
            stroke="#4a6080"
            tick={{ fill: '#8899aa', fontSize: 11 }}
            label={{ value: '対局No', position: 'insideBottomRight', offset: -5, fill: '#4a6080', fontSize: 10 }}
          />
          <YAxis
            stroke="#4a6080"
            tick={{ fill: '#8899aa', fontSize: 11 }}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e2d3d', border: '1px solid #2d4a6a', borderRadius: 8 }}
            labelStyle={{ color: '#d4af37' }}
            labelFormatter={(v) => `対局 #${v}`}
            formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
          />
          <Legend wrapperStyle={{ color: '#8899aa', fontSize: 12 }} />
          <ReferenceLine y={25} stroke="#4a6080" strokeDasharray="3 3" strokeOpacity={0.5} />
          <Line type="monotone" dataKey="1着率" stroke={color} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="トップ率" stroke="#60a5fa" strokeWidth={2} dot={false} activeDot={{ r: 4 }} strokeDasharray="6 2" />
          <Line type="monotone" dataKey="4着率" stroke="#f87171" strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} strokeDasharray="3 3" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
