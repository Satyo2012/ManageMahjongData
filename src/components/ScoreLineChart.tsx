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
import type { PlayerStats } from '../types'

interface Props {
  players: PlayerStats[]
  maxGames?: number
}

const PLAYER_COLORS = [
  '#d4af37', '#4ade80', '#60a5fa', '#f87171',
  '#a78bfa', '#fb923c', '#34d399', '#f472b6',
]

export function ScoreLineChart({ players, maxGames }: Props) {
  const maxLen = maxGames ?? Math.max(...players.map((p) => p.cumulativeScoreHistory.length))
  const data = Array.from({ length: maxLen }, (_, i) => {
    const point: Record<string, number | string> = { game: i + 1 }
    for (const p of players) {
      if (i < p.cumulativeScoreHistory.length) {
        point[p.name] = p.cumulativeScoreHistory[i]
      }
    }
    return point
  })

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d4a6a" />
        <XAxis
          dataKey="game"
          stroke="#4a6080"
          tick={{ fill: '#8899aa', fontSize: 12 }}
          label={{ value: '対局数', position: 'insideBottomRight', offset: -5, fill: '#4a6080' }}
        />
        <YAxis stroke="#4a6080" tick={{ fill: '#8899aa', fontSize: 12 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e2d3d', border: '1px solid #2d4a6a', borderRadius: 8 }}
          labelStyle={{ color: '#d4af37' }}
          labelFormatter={(v) => `${v}局目`}
          formatter={(value: number, name: string) => [
            `${value > 0 ? '+' : ''}${value.toFixed(1)}`,
            name,
          ]}
        />
        <Legend wrapperStyle={{ color: '#8899aa' }} />
        <ReferenceLine y={0} stroke="#4a6080" strokeDasharray="4 4" />
        {players.map((p, i) => (
          <Line
            key={p.name}
            type="monotone"
            dataKey={p.name}
            stroke={PLAYER_COLORS[i % PLAYER_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
