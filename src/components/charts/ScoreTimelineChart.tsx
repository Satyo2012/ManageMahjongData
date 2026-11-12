import { useMemo } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { BookBoundary, Game } from '../../types'
import { formatDate } from '../../domain/date'
import { round } from '../../domain/math'
import { formatSigned } from '../../utils/format'
import { usePlayerColor } from '../../theme/PlayerColorContext'
import { AXIS_PROPS, CHART_COLORS, GRID_PROPS, TOOLTIP_PROPS, axisLabel } from '../../theme/chartTheme'
import { linearRegression } from './regression'

interface Props {
  games: Game[]
  players: string[]
  bookBoundaries: BookBoundary[]
  showTrend: boolean
  height?: number
}

/** 日付ラベルを付ける最小間隔（全体の局数に対する割合） */
const LABEL_SPACING_RATIO = 1 / 10
const TREND_SUFFIX = '_trend'

type Point = Record<string, number | undefined>

function buildSeries(games: Game[], players: string[]): Point[] {
  const lastIndex: Record<string, number> = {}
  games.forEach((g, i) => {
    for (const p of players) if (g.players[p]) lastIndex[p] = i
  })

  const cumulative: Record<string, number> = {}
  return games.map((game, i) => {
    const point: Point = { idx: i + 1 }
    for (const name of players) {
      const result = game.players[name]
      if (result) cumulative[name] = (cumulative[name] ?? 0) + result.score
      // 参加前と最終参加後は線を描かない。途中の欠席は直前の値で横ばい
      if (cumulative[name] !== undefined && i <= lastIndex[name]) point[name] = round(cumulative[name], 1)
    }
    return point
  })
}

/** 実際に参加した対局の点だけで回帰直線を引く（欠席中の横ばいは含めない） */
function addTrendLines(series: Point[], games: Game[], players: string[]): void {
  for (const name of players) {
    const pts = series.filter((_, i) => games[i].players[name])
    const fit = linearRegression(pts.map((p) => p.idx as number), pts.map((p) => p[name] as number))
    if (!fit) continue
    for (const p of series) p[name + TREND_SUFFIX] = round(fit.slope * (p.idx as number) + fit.intercept, 1)
  }
}

/** 全対局を共通の時間軸として累積スコアを描く。縦線はセッション（ブック）の区切り */
export function ScoreTimelineChart({ games, players, bookBoundaries, showTrend, height = 360 }: Props) {
  const colorOf = usePlayerColor()

  const data = useMemo(() => {
    const series = buildSeries(games, players)
    if (showTrend) addTrendLines(series, games, players)
    return series
  }, [games, players, showTrend])

  const { lines, labeled } = useMemo(() => {
    const minSpacing = Math.max(1, Math.floor(games.length * LABEL_SPACING_RATIO))
    const labeledSet = new Set<number>()
    let last = -Infinity
    for (const b of bookBoundaries) {
      if (b.startIndex - last >= minSpacing) {
        labeledSet.add(b.startIndex)
        last = b.startIndex
      }
    }
    return { lines: bookBoundaries.filter((b) => b.startIndex > 0), labeled: labeledSet }
  }, [bookBoundaries, games.length])

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="idx" {...AXIS_PROPS} label={axisLabel('対局（全体）')} minTickGap={24} />
        <YAxis {...AXIS_PROPS} />
        <Tooltip
          {...TOOLTIP_PROPS}
          labelFormatter={(v) => `#${v} · ${formatDate(games[Number(v) - 1]?.date)}`}
          formatter={(value: number, name: string) => [formatSigned(value), name]}
          itemSorter={(item) => -Number(item.value)}
          filterNull
        />
        <ReferenceLine y={0} stroke={CHART_COLORS.zeroLine} strokeDasharray="4 4" />
        {lines.map((b) => (
          <ReferenceLine
            key={b.startIndex}
            // データの idx は 1 始まりなので、セッション最初の対局は startIndex + 1
            x={b.startIndex + 1}
            stroke={CHART_COLORS.gold}
            strokeOpacity={0.25}
            strokeDasharray="4 3"
            label={labeled.has(b.startIndex) ? { value: formatDate(b.date), position: 'insideTopLeft', fill: CHART_COLORS.gold, fontSize: 10 } : undefined}
          />
        ))}
        {players.map((name) => (
          <Line key={name} type="monotone" dataKey={name} stroke={colorOf(name)} strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
        ))}
        {showTrend &&
          players.map((name) => (
            <Line
              key={name + TREND_SUFFIX}
              type="linear"
              dataKey={name + TREND_SUFFIX}
              stroke={colorOf(name)}
              strokeWidth={1}
              strokeDasharray="8 4"
              strokeOpacity={0.6}
              dot={false}
              activeDot={false}
              tooltipType="none"
              isAnimationActive={false}
            />
          ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
