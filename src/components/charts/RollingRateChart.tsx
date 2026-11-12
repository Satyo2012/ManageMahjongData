import { useMemo, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PlayerStats } from '../../types'
import { computeRollingRates } from '../../domain/rolling'
import { formatDate } from '../../domain/date'
import { AXIS_PROPS, CHART_COLORS, GRID_PROPS, TOOLTIP_PROPS, axisLabel } from '../../theme/chartTheme'
import { SegmentedControl } from '../ui/SegmentedControl'

interface Props {
  stats: PlayerStats
  color: string
}

const WINDOWS = [10, 20, 30, 50]
const DEFAULT_WINDOW = 20
/** 4人打ちの期待値（各着順 25%）の目安線 */
const EXPECTED_RATE = 25

/** 直近 N 局の 1着率・連帯率・4着率の移動平均 */
export function RollingRateChart({ stats, color }: Props) {
  const [windowSize, setWindowSize] = useState(DEFAULT_WINDOW)
  const effectiveWindow = stats.games >= windowSize ? windowSize : WINDOWS.filter((w) => w <= stats.games).pop()

  const data = useMemo(
    () => (effectiveWindow ? computeRollingRates(stats.rankHistory, stats.dateHistory, effectiveWindow) : []),
    [stats, effectiveWindow],
  )

  if (!effectiveWindow) {
    return (
      <p className="text-slate-400 text-sm text-center py-6">
        移動平均の表示には{WINDOWS[0]}局以上必要です（現在 {stats.games} 局）
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-slate-300">
        <span>直近</span>
        <SegmentedControl
          ariaLabel="移動平均の局数"
          value={effectiveWindow}
          onChange={setWindowSize}
          options={WINDOWS.map((w) => ({ value: w, label: `${w}局`, disabled: stats.games < w }))}
        />
        <span>の移動平均</span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="gameNumber" {...AXIS_PROPS} label={axisLabel('局目')} minTickGap={24} />
          <YAxis {...AXIS_PROPS} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            {...TOOLTIP_PROPS}
            labelFormatter={(v, payload) => `${v}局目 · ${formatDate(payload?.[0]?.payload?.date)}`}
            formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
          />
          <Legend wrapperStyle={{ color: CHART_COLORS.tick, fontSize: 12 }} />
          <ReferenceLine y={EXPECTED_RATE} stroke={CHART_COLORS.zeroLine} strokeDasharray="3 3" />
          <Line type="monotone" dataKey="firstRate" name="1着率" stroke={color} strokeWidth={2.5} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="top2Rate" name="連帯率" stroke="#60a5fa" strokeWidth={2} strokeDasharray="6 2" dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="fourthRate" name="4着率" stroke={CHART_COLORS.negative} strokeWidth={1.5} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
