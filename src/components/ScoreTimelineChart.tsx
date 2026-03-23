import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import type { Game, BookBoundary } from '../types'

interface Props {
  games: Game[]
  playerNames: string[]
  bookBoundaries: BookBoundary[]
  height?: number
}

const PLAYER_COLORS = [
  '#d4af37', '#4ade80', '#60a5fa', '#f87171',
  '#a78bfa', '#fb923c', '#34d399', '#f472b6',
]

/** 全ゲームを共有X軸として累積スコアを描画するチャート */
export function ScoreTimelineChart({ games, playerNames, bookBoundaries, height = 340 }: Props) {
  const data = useMemo(() => {
    const cumScores: Record<string, number> = {}
    return games.map((game, idx) => {
      const point: Record<string, number | string> = { idx: idx + 1 }
      // ゲームに参加したプレイヤーのスコアを累積
      for (const name of playerNames) {
        const result = game.players[name]
        if (result !== undefined) {
          cumScores[name] = (cumScores[name] ?? 0) + result.score
        }
        // 参加していないゲームでも最後の累積値を保持（途中参加にも対応）
        if (cumScores[name] !== undefined) {
          point[name] = Math.round(cumScores[name] * 10) / 10
        }
      }
      return point
    })
  }, [games, playerNames])

  /** ブック境界のラベル（同日複数ブックは省略） */
  const boundaries = useMemo(() => {
    const seen = new Set<string>()
    return bookBoundaries.filter((b) => {
      if (seen.has(b.date)) return false
      seen.add(b.date)
      return true
    })
  }, [bookBoundaries])

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d4a6a" />
        <XAxis
          dataKey="idx"
          stroke="#4a6080"
          tick={{ fill: '#8899aa', fontSize: 11 }}
          label={{ value: '対局（全体）', position: 'insideBottomRight', offset: -4, fill: '#4a6080', fontSize: 11 }}
        />
        <YAxis stroke="#4a6080" tick={{ fill: '#8899aa', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e2d3d', border: '1px solid #2d4a6a', borderRadius: 8 }}
          labelStyle={{ color: '#d4af37' }}
          labelFormatter={(v) => {
            const idx = Number(v) - 1
            const boundary = [...bookBoundaries].reverse().find((b) => b.startIndex <= idx)
            const dateLabel = boundary ? `  📅 ${boundary.date}` : ''
            return `対局 #${v}${dateLabel}`
          }}
          formatter={(value: number, name: string) => [
            `${value > 0 ? '+' : ''}${value.toFixed(1)}`,
            name,
          ]}
        />
        <Legend wrapperStyle={{ color: '#8899aa' }} />
        <ReferenceLine y={0} stroke="#4a6080" strokeDasharray="4 4" />

        {/* ブック境界ライン */}
        {boundaries.map((b) =>
          b.startIndex > 0 ? (
            <ReferenceLine
              key={`${b.startIndex}-${b.date}`}
              x={b.startIndex}
              stroke="#d4af37"
              strokeOpacity={0.5}
              strokeDasharray="5 3"
              label={{
                value: b.date,
                position: 'top',
                fill: '#d4af37',
                fontSize: 10,
                opacity: 0.85,
              }}
            />
          ) : null,
        )}

        {playerNames.map((name, i) => (
          <Line
            key={name}
            type="monotone"
            dataKey={name}
            stroke={PLAYER_COLORS[i % PLAYER_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
