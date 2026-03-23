import { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
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
  '#e879f9', '#22d3ee', '#fbbf24', '#86efac',
]

function linearRegression(xs: number[], ys: number[]) {
  const n = xs.length
  if (n < 2) return null
  const sx = xs.reduce((a, b) => a + b, 0)
  const sy = ys.reduce((a, b) => a + b, 0)
  const sxy = xs.reduce((a, b, i) => a + b * ys[i], 0)
  const sxx = xs.reduce((a, b) => a + b * b, 0)
  const denom = n * sxx - sx * sx
  if (denom === 0) return null
  const slope = (n * sxy - sx * sy) / denom
  const intercept = (sy - slope * sx) / n
  return { slope, intercept }
}

/** 全ゲームを共有X軸として累積スコアを描画するチャート */
export function ScoreTimelineChart({ games, playerNames, bookBoundaries, height = 360 }: Props) {
  const [hiddenPlayers, setHiddenPlayers] = useState<Set<string>>(new Set())
  const [showRegression, setShowRegression] = useState(false)

  const togglePlayer = (name: string) =>
    setHiddenPlayers((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })

  // 各プレイヤーの最後に参加したゲームインデックスを事前計算
  const lastGameIdx = useMemo(() => {
    const map: Record<string, number> = {}
    games.forEach((game, idx) => {
      for (const name of playerNames) {
        if (game.players[name] !== undefined) map[name] = idx
      }
    })
    return map
  }, [games, playerNames])

  // 回帰直線のパラメータを計算
  const regressions = useMemo(() => {
    if (!showRegression) return {}
    const cumAt: Record<string, number> = {}
    const points: Record<string, { x: number; y: number }[]> = {}

    games.forEach((game, idx) => {
      for (const name of playerNames) {
        const result = game.players[name]
        if (result !== undefined) {
          cumAt[name] = (cumAt[name] ?? 0) + result.score
          if (!points[name]) points[name] = []
          points[name].push({ x: idx + 1, y: Math.round(cumAt[name] * 10) / 10 })
        }
      }
    })

    const result: Record<string, { slope: number; intercept: number } | null> = {}
    for (const name of playerNames) {
      if (!points[name] || points[name].length < 2) { result[name] = null; continue }
      result[name] = linearRegression(points[name].map((p) => p.x), points[name].map((p) => p.y))
    }
    return result
  }, [games, playerNames, showRegression])

  // チャートデータ生成
  const data = useMemo(() => {
    const cumScores: Record<string, number> = {}
    return games.map((game, idx) => {
      const point: Record<string, number | string | null> = { idx: idx + 1 }
      for (const name of playerNames) {
        const result = game.players[name]
        if (result !== undefined) {
          cumScores[name] = (cumScores[name] ?? 0) + result.score
          point[name] = Math.round(cumScores[name] * 10) / 10
        } else if (cumScores[name] !== undefined && idx <= (lastGameIdx[name] ?? -1)) {
          // 途中欠席：最終参加前はフラット
          point[name] = Math.round(cumScores[name] * 10) / 10
        }
        // 最終参加より後 → undefined → 線が終わる

        // 回帰直線の値
        if (showRegression) {
          const reg = regressions[name]
          if (reg) {
            point[`${name}_trend`] = Math.round((reg.slope * (idx + 1) + reg.intercept) * 10) / 10
          }
        }
      }
      return point
    })
  }, [games, playerNames, lastGameIdx, showRegression, regressions])

  // ブック境界ラベルを間引く
  const { boundaryLines, labeledSet } = useMemo(() => {
    const total = games.length
    const minSpacing = Math.max(20, Math.floor(total / 12))
    const deduped = bookBoundaries.filter((b, i, arr) => {
      if (b.startIndex === 0) return false
      return arr.findIndex((x) => x.date === b.date) === i
    })
    const labeled = new Set<number>()
    let lastLabeled = -Infinity
    for (const b of deduped) {
      if (b.startIndex - lastLabeled >= minSpacing) {
        labeled.add(b.startIndex)
        lastLabeled = b.startIndex
      }
    }
    return { boundaryLines: deduped, labeledSet: labeled }
  }, [bookBoundaries, games.length])

  const showToggle = playerNames.length > 4

  return (
    <div className="space-y-3">
      {/* コントロールバー */}
      <div className="flex items-center gap-4 flex-wrap justify-between">
        {/* プレイヤー表示トグル */}
        {showToggle && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-500">表示：</span>
            {playerNames.map((name, i) => {
              const hidden = hiddenPlayers.has(name)
              const color = PLAYER_COLORS[i % PLAYER_COLORS.length]
              return (
                <button
                  key={name}
                  onClick={() => togglePlayer(name)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all ${
                    hidden ? 'border-[#2d4a6a] text-slate-600' : 'text-white'
                  }`}
                  style={hidden ? {} : { backgroundColor: color + '28', borderColor: color + '88' }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hidden ? '#4a6080' : color }} />
                  {name}
                </button>
              )
            })}
            {hiddenPlayers.size > 0 && (
              <button onClick={() => setHiddenPlayers(new Set())} className="text-xs text-[#d4af37] hover:underline">
                全員表示
              </button>
            )}
          </div>
        )}

        {/* 回帰直線トグル */}
        <button
          onClick={() => setShowRegression((v) => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
            showRegression ? 'bg-[#d4af37]/20 border border-[#d4af37]/60 text-[#d4af37]' : 'card text-slate-500 hover:border-[#d4af37]/40 hover:text-slate-300'
          }`}
        >
          📈 トレンド線
        </button>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 5 }}>
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
              return `対局 #${v}　📅 ${boundary?.date ?? ''}`
            }}
            formatter={(value: number, name: string) => {
              if (String(name).endsWith('_trend')) return null as unknown as [string, string]
              return [`${value > 0 ? '+' : ''}${value.toFixed(1)}`, String(name)]
            }}
          />
          <Legend wrapperStyle={{ display: 'none' }} />
          <ReferenceLine y={0} stroke="#4a6080" strokeDasharray="4 4" />

          {boundaryLines.map((b) => (
            <ReferenceLine
              key={`${b.startIndex}-${b.date}`}
              x={b.startIndex}
              stroke="#d4af37"
              strokeOpacity={0.35}
              strokeDasharray="4 3"
              label={
                labeledSet.has(b.startIndex)
                  ? { value: b.date, position: 'insideTopRight', fill: '#d4af37', fontSize: 9, opacity: 0.75 }
                  : undefined
              }
            />
          ))}

          {/* 実績ライン */}
          {playerNames.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={PLAYER_COLORS[i % PLAYER_COLORS.length]}
              strokeWidth={hiddenPlayers.has(name) ? 0 : 2}
              dot={false}
              activeDot={hiddenPlayers.has(name) ? false : { r: 4 }}
              connectNulls={false}
              hide={hiddenPlayers.has(name)}
            />
          ))}

          {/* 回帰直線（トレンド線）*/}
          {showRegression &&
            playerNames.map((name, i) => (
              <Line
                key={`${name}_trend`}
                type="linear"
                dataKey={`${name}_trend`}
                stroke={PLAYER_COLORS[i % PLAYER_COLORS.length]}
                strokeWidth={hiddenPlayers.has(name) ? 0 : 1}
                strokeDasharray="8 4"
                strokeOpacity={0.6}
                dot={false}
                activeDot={false}
                hide={hiddenPlayers.has(name)}
                legendType="none"
                connectNulls
              />
            ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
