import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { PlayerStats } from '../types'

interface Props {
  stats: PlayerStats
}

export function RankDistributionChart({ stats }: Props) {
  const data = [
    { rank: '1着', count: stats.firstCount, rate: stats.firstRate, color: '#eab308' },
    { rank: '2着', count: stats.secondCount, rate: stats.secondRate, color: '#94a3b8' },
    { rank: '3着', count: stats.thirdCount, rate: stats.thirdRate, color: '#b45309' },
    { rank: '4着', count: stats.fourthCount, rate: stats.fourthRate, color: '#991b1b' },
  ]

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d4a6a" />
        <XAxis dataKey="rank" stroke="#4a6080" tick={{ fill: '#8899aa', fontSize: 12 }} />
        <YAxis stroke="#4a6080" tick={{ fill: '#8899aa', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e2d3d', border: '1px solid #2d4a6a', borderRadius: 8 }}
          formatter={(value: number, _: string, entry) => [
            `${value}回 (${(entry.payload as { rate: number }).rate.toFixed(1)}%)`,
            '回数',
          ]}
          labelStyle={{ color: '#d4af37' }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.rank} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
