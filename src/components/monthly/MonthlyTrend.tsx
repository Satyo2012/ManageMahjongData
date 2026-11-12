import { useMemo, useState } from 'react'
import { BarChart2, CalendarDays } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MahjongData } from '../../types'
import { computeMonthlyRows } from '../../domain/periodic'
import { countUndatedGames } from '../../domain/filter'
import { useVisiblePlayers } from '../../hooks/useVisiblePlayers'
import { usePlayerColor } from '../../theme/PlayerColorContext'
import { AXIS_PROPS, CHART_COLORS, GRID_PROPS, TOOLTIP_PROPS } from '../../theme/chartTheme'
import { SegmentedControl } from '../ui/SegmentedControl'
import { PlayerToggle } from '../ui/PlayerToggle'
import { PlayerName } from '../ui/PlayerName'
import { Section } from '../ui/Section'
import { METRICS, METRIC_KEYS, metricValue, type MetricKey } from './metrics'

export function MonthlyTrend({ data }: { data: MahjongData }) {
  const [metric, setMetric] = useState<MetricKey>('avgScore')
  const colorOf = usePlayerColor()
  const visibility = useVisiblePlayers(data.players)
  const def = METRICS[metric]

  const rows = useMemo(() => computeMonthlyRows(data.games), [data.games])
  const undated = useMemo(() => countUndatedGames(data.games), [data.games])
  const chartData = useMemo(
    () =>
      rows.map((row) => ({
        month: row.month,
        ...Object.fromEntries(visibility.visible.map((p) => [p, metricValue(row.players[p], metric)])),
      })),
    [rows, visibility.visible, metric],
  )
  const newestFirst = useMemo(() => [...rows].reverse(), [rows])

  if (rows.length === 0) {
    return <p className="text-slate-400 text-sm text-center py-12">日付付きの対局がありません（ファイル名に日付が含まれているか確認してください）</p>
  }

  return (
    <div className="space-y-5">
      <Section
        icon={BarChart2}
        title="月次成績推移"
        note={undated > 0 ? `日付不明の${undated}局は月が特定できないため除外` : undefined}
        actions={<SegmentedControl ariaLabel="指標" value={metric} onChange={setMetric} options={METRIC_KEYS.map((k) => ({ value: k, label: METRICS[k].label }))} />}
      >
        <div className="space-y-4">
          <PlayerToggle
            players={data.players}
            visible={visibility.visible}
            onToggle={visibility.toggle}
            onShowAll={visibility.showAll}
            onReset={visibility.reset}
            isDefault={visibility.isDefault}
          />
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis dataKey="month" {...AXIS_PROPS} minTickGap={16} />
              <YAxis {...AXIS_PROPS} reversed={def.lowerIsBetter} domain={def.domain ?? ['auto', 'auto']} tickFormatter={(v) => def.format(Number(v))} />
              {metric !== 'avgRank' && metric !== 'firstRate' && <ReferenceLine y={0} stroke={CHART_COLORS.zeroLine} strokeDasharray="4 4" />}
              <Tooltip {...TOOLTIP_PROPS} formatter={(v: number, name: string) => [def.format(v), name]} />
              {visibility.visible.map((p) => (
                <Line key={p} type="monotone" dataKey={p} stroke={colorOf(p)} strokeWidth={2} dot={{ r: 2.5 }} connectNulls isAnimationActive={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section icon={CalendarDays} title={`${def.label}（月次一覧）`} note="新しい月が上。括弧内は対局数">
        <div className="overflow-x-auto">
          <table className="text-sm w-full">
            <thead>
              <tr className="text-slate-300 text-xs border-b border-mahjong-border">
                <th className="text-left py-2 px-3 sticky left-0 bg-mahjong-card">月</th>
                {visibility.visible.map((p) => (
                  <th key={p} className="text-right py-2 px-3 whitespace-nowrap font-medium">
                    <PlayerName name={p} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {newestFirst.map((row) => (
                <tr key={row.month} className="border-b border-mahjong-border/40 hover:bg-mahjong-hover">
                  <td className="py-2 px-3 text-mahjong-gold font-medium tabular-nums sticky left-0 bg-mahjong-card">{row.month}</td>
                  {visibility.visible.map((p) => {
                    const stat = row.players[p]
                    const value = metricValue(stat, metric)
                    if (value === undefined || !stat) {
                      return <td key={p} className="py-2 px-3 text-right text-slate-500">-</td>
                    }
                    return (
                      <td key={p} className={`py-2 px-3 text-right font-mono text-xs whitespace-nowrap ${def.isGood(value) ? 'text-emerald-400' : 'text-red-400'}`}>
                        {def.format(value)}
                        <span className="text-slate-400 ml-1">({stat.games})</span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  )
}
