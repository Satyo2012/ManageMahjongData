import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PlayerStats } from '../../types'
import { AXIS_PROPS, GRID_PROPS, RANK_COLORS, TOOLTIP_PROPS } from '../../theme/chartTheme'

interface Props {
  stats: PlayerStats
}

export function RankDistributionChart({ stats }: Props) {
  const data = [
    { rank: '1着', count: stats.firstCount, rate: stats.firstRate, color: RANK_COLORS[1] },
    { rank: '2着', count: stats.secondCount, rate: stats.secondRate, color: RANK_COLORS[2] },
    { rank: '3着', count: stats.thirdCount, rate: stats.thirdRate, color: RANK_COLORS[3] },
    { rank: '4着', count: stats.fourthCount, rate: stats.fourthRate, color: RANK_COLORS[4] },
  ]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="rank" {...AXIS_PROPS} />
        <YAxis {...AXIS_PROPS} allowDecimals={false} />
        <Tooltip
          {...TOOLTIP_PROPS}
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          formatter={(value: number, _name: string, entry) => [
            `${value}回 (${(entry.payload as { rate: number }).rate.toFixed(1)}%)`,
            '回数',
          ]}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.rank} fill={d.color} />
          ))}
          <LabelList dataKey="rate" position="top" formatter={(v: number) => `${v.toFixed(1)}%`} fill="#cbd5e1" fontSize={11} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
