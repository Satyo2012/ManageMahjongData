import { useMemo } from 'react'
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { HeadToHeadStats } from '../../types'
import { headToHeadCumulative } from '../../domain/headToHead'
import { formatDate } from '../../domain/date'
import { formatSigned } from '../../utils/format'
import { AXIS_PROPS, CHART_COLORS, GRID_PROPS, H2H_COLORS, TOOLTIP_PROPS, axisLabel } from '../../theme/chartTheme'

const LEGEND_STYLE = { color: CHART_COLORS.tick, fontSize: 12 }

export function H2HCharts({ h2h }: { h2h: HeadToHeadStats }) {
  const { playerA, playerB } = h2h

  const countData = [
    { name: '1着回数', [playerA]: h2h.playerAFirstCount, [playerB]: h2h.playerBFirstCount },
    { name: '相手より上位', [playerA]: h2h.playerAWins, [playerB]: h2h.playerBWins },
  ]
  const cumulative = useMemo(
    () => headToHeadCumulative(h2h).map((p) => ({ index: p.index, date: p.date, [playerA]: p.a, [playerB]: p.b })),
    [h2h, playerA, playerB],
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="card p-5">
        <h3 className="font-bold text-base mb-4">1着・勝ち数</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={countData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="name" {...AXIS_PROPS} />
            <YAxis {...AXIS_PROPS} allowDecimals={false} />
            <Tooltip {...TOOLTIP_PROPS} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Legend wrapperStyle={LEGEND_STYLE} />
            <Bar dataKey={playerA} fill={H2H_COLORS.a} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            <Bar dataKey={playerB} fill={H2H_COLORS.b} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-5 lg:col-span-2">
        <h3 className="font-bold text-base mb-4">同卓時の累積スコア推移</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={cumulative} margin={{ top: 5, right: 24, left: 0, bottom: 8 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="index" {...AXIS_PROPS} label={axisLabel('同卓局目')} minTickGap={24} />
            <YAxis {...AXIS_PROPS} />
            <ReferenceLine y={0} stroke={CHART_COLORS.zeroLine} strokeDasharray="4 4" />
            <Tooltip
              {...TOOLTIP_PROPS}
              labelFormatter={(v, payload) => `${v}局目 · ${formatDate(payload?.[0]?.payload?.date)}`}
              formatter={(value: number, name: string) => [formatSigned(value), name]}
            />
            <Legend wrapperStyle={LEGEND_STYLE} />
            <Line type="monotone" dataKey={playerA} stroke={H2H_COLORS.a} strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey={playerB} stroke={H2H_COLORS.b} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
