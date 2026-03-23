import { useMemo, useState } from 'react'
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

/** 全ゲームを共有X軸として累積スコアを描画するチャート */
export function ScoreTimelineChart({ games, playerNames, bookBoundaries, height = 360 }: Props) {
  // プレイヤー表示トグル
  const [hiddenPlayers, setHiddenPlayers] = useState<Set<string>>(new Set())

  const togglePlayer = (name: string) => {
    setHiddenPlayers((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

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

  // チャートデータ生成
  // ・参加したゲームでスコアを累積
  // ・参加していない中間ゲームは最後の値を保持（フラットな線）
  // ・最終参加ゲーム以降は undefined → 線がそこで終わる
  const data = useMemo(() => {
    const cumScores: Record<string, number> = {}
    return games.map((game, idx) => {
      const point: Record<string, number | string | null> = { idx: idx + 1 }
      for (const name of playerNames) {
        const result = game.players[name]
        if (result !== undefined) {
          // このゲームに参加 → スコアを加算
          cumScores[name] = (cumScores[name] ?? 0) + result.score
          point[name] = Math.round(cumScores[name] * 10) / 10
        } else if (cumScores[name] !== undefined && idx <= (lastGameIdx[name] ?? -1)) {
          // 途中欠席だが最終参加前 → フラットに保持
          point[name] = Math.round(cumScores[name] * 10) / 10
        }
        // 最終参加より後 → point[name] = undefined → 線が終わる
      }
      return point
    })
  }, [games, playerNames, lastGameIdx])

  // ブック境界：表示するラベルを間引く
  // ・先頭 (startIndex=0) は線なし
  // ・ゲーム数に対して最大15本のラベルを均等に表示
  const { boundaryLines, labeledSet } = useMemo(() => {
    const total = games.length
    const minSpacing = Math.max(20, Math.floor(total / 12))

    // 重複日付を除いた境界一覧（先頭除く）
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

  return (
    <div className="space-y-3">
      {/* プレイヤー表示トグル（人数が多いときに便利） */}
      {playerNames.length > 4 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-slate-500 self-center mr-1">表示：</span>
          {playerNames.map((name, i) => {
            const hidden = hiddenPlayers.has(name)
            const color = PLAYER_COLORS[i % PLAYER_COLORS.length]
            return (
              <button
                key={name}
                onClick={() => togglePlayer(name)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all ${
                  hidden
                    ? 'border-[#2d4a6a] text-slate-600 bg-transparent'
                    : 'border-transparent text-white'
                }`}
                style={hidden ? {} : { backgroundColor: color + '33', borderColor: color + '88' }}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: hidden ? '#4a6080' : color }}
                />
                {name}
              </button>
            )
          })}
          {hiddenPlayers.size > 0 && (
            <button
              onClick={() => setHiddenPlayers(new Set())}
              className="text-xs text-[#d4af37] hover:underline self-center ml-1"
            >
              全員表示
            </button>
          )}
        </div>
      )}

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
            formatter={(value: number, name: string) => [
              `${value > 0 ? '+' : ''}${value.toFixed(1)}`,
              name,
            ]}
          />
          <Legend wrapperStyle={{ color: '#8899aa', display: 'none' }} />
          <ReferenceLine y={0} stroke="#4a6080" strokeDasharray="4 4" />

          {/* ブック境界ライン：ラベルは間引いて表示 */}
          {boundaryLines.map((b) => (
            <ReferenceLine
              key={`${b.startIndex}-${b.date}`}
              x={b.startIndex}
              stroke="#d4af37"
              strokeOpacity={0.35}
              strokeDasharray="4 3"
              label={
                labeledSet.has(b.startIndex)
                  ? {
                      value: b.date,
                      position: 'insideTopRight',
                      fill: '#d4af37',
                      fontSize: 9,
                      opacity: 0.75,
                    }
                  : undefined
              }
            />
          ))}

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
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
