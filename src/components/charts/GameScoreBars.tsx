import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PlayerStats } from '../../types'
import { formatDate } from '../../domain/date'
import { formatSigned } from '../../utils/format'
import { AXIS_PROPS, CHART_COLORS, GRID_PROPS, TOOLTIP_PROPS, axisLabel } from '../../theme/chartTheme'

interface Props {
  stats: PlayerStats
}

/** 1局ごとのスコア（プラスは緑、マイナスは赤） */
export function GameScoreBars({ stats }: Props) {
  const data = stats.scoreHistory.map((score, i) => ({
    game: i + 1,
    score,
    rank: stats.rankHistory[i],
    date: stats.dateHistory[i],
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 8 }} barCategoryGap={1}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="game" {...AXIS_PROPS} label={axisLabel('局目')} minTickGap={24} />
        <YAxis {...AXIS_PROPS} />
        <Tooltip
          {...TOOLTIP_PROPS}
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          labelFormatter={(v, payload) => {
            const p = payload?.[0]?.payload as (typeof data)[number] | undefined
            return `${v}局目 · ${formatDate(p?.date)} · ${p?.rank ?? ''}着`
          }}
          formatter={(value: number) => [formatSigned(value), 'スコア']}
        />
        <ReferenceLine y={0} stroke={CHART_COLORS.zeroLine} />
        <Bar dataKey="score" isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.game} fill={d.score >= 0 ? CHART_COLORS.positive : CHART_COLORS.negative} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
