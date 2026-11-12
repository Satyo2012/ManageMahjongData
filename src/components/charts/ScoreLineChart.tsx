import { useMemo } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PlayerStats } from '../../types'
import { formatSigned } from '../../utils/format'
import { usePlayerColor } from '../../theme/PlayerColorContext'
import { AXIS_PROPS, CHART_COLORS, GRID_PROPS, TOOLTIP_PROPS, axisLabel } from '../../theme/chartTheme'

interface Props {
  players: PlayerStats[]
  height?: number
}

/** 各プレイヤーの「n局目」時点の累積スコア */
export function ScoreLineChart({ players, height = 340 }: Props) {
  const colorOf = usePlayerColor()

  const data = useMemo(() => {
    const maxLen = Math.max(0, ...players.map((p) => p.cumulativeScoreHistory.length))
    return Array.from({ length: maxLen }, (_, i) => {
      const point: Record<string, number> = { game: i + 1 }
      for (const p of players) {
        if (i < p.cumulativeScoreHistory.length) point[p.name] = p.cumulativeScoreHistory[i]
      }
      return point
    })
  }, [players])

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="game" {...AXIS_PROPS} label={axisLabel('局目')} minTickGap={24} />
        <YAxis {...AXIS_PROPS} />
        <Tooltip
          {...TOOLTIP_PROPS}
          labelFormatter={(v) => `${v}局目`}
          formatter={(value: number, name: string) => [formatSigned(value), name]}
          itemSorter={(item) => -Number(item.value)}
        />
        <ReferenceLine y={0} stroke={CHART_COLORS.zeroLine} strokeDasharray="4 4" />
        {players.map((p) => (
          <Line
            key={p.name}
            type="monotone"
            dataKey={p.name}
            stroke={colorOf(p.name)}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
