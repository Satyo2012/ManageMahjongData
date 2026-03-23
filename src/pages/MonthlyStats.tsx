import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { MahjongData } from '../types'
import { CalendarDays, BarChart2, Grid3x3 } from 'lucide-react'

interface Props {
  data: MahjongData
}

const PLAYER_COLORS = [
  '#d4af37', '#4ade80', '#60a5fa', '#f87171',
  '#a78bfa', '#fb923c', '#34d399', '#f472b6',
  '#e879f9', '#22d3ee', '#fbbf24', '#86efac',
]

/** データ内の最小〜最大着順を [0,1] に正規化して緑→赤グラデーションを返す */
function rankToColor(avgRank: number, minRank: number, maxRank: number) {
  const range = maxRank - minRank
  const t = range > 0.001 ? Math.max(0, Math.min(1, (avgRank - minRank) / range)) : 0.5
  const hue = Math.round(120 * (1 - t)) // 120=緑(良) → 0=赤(悪)
  return {
    text: `hsl(${hue}, 85%, 60%)`,
    bg: `hsla(${hue}, 85%, 45%, 0.25)`,
    border: `hsla(${hue}, 85%, 55%, 0.6)`,
  }
}

type ViewMode = 'monthly' | 'heatmap'

export function MonthlyStats({ data }: Props) {
  const [mode, setMode] = useState<ViewMode>('monthly')
  const [metric, setMetric] = useState<'avgScore' | 'avgRank' | 'firstRate'>('avgScore')

  const activePlayers = data.players.filter((p) => data.stats[p]?.games > 0)

  // ─── 月次集計 ───────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const map = new Map<string, Record<string, { scores: number[]; ranks: number[]; games: number }>>()

    for (const game of data.games) {
      const month = game.date?.slice(0, 7) ?? '不明'
      if (!map.has(month)) map.set(month, {})
      const monthMap = map.get(month)!
      for (const [player, result] of Object.entries(game.players)) {
        if (!monthMap[player]) monthMap[player] = { scores: [], ranks: [], games: 0 }
        monthMap[player].scores.push(result.score)
        monthMap[player].ranks.push(result.rank)
        monthMap[player].games++
      }
    }

    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, playerMap]) => {
        const point: Record<string, string | number> = { month }
        for (const player of activePlayers) {
          const d = playerMap[player]
          if (!d) continue
          const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
          point[`${player}_avgScore`] = Math.round(avg(d.scores) * 100) / 100
          point[`${player}_avgRank`] = Math.round(avg(d.ranks) * 100) / 100
          point[`${player}_firstRate`] = Math.round((d.ranks.filter((r) => r === 1).length / d.games) * 1000) / 10
          point[`${player}_games`] = d.games
        }
        return point
      })
  }, [data.games, activePlayers])

  // ─── セッション別ヒートマップ ────────────────────────────
  const heatmapData = useMemo(() => {
    return data.bookBoundaries.map((boundary, i) => {
      const nextBoundary = data.bookBoundaries[i + 1]
      const sessionGames = data.games.slice(
        boundary.startIndex,
        nextBoundary?.startIndex ?? data.games.length,
      )

      const playerStats: Record<string, { avgRank: number; totalScore: number; games: number }> = {}
      for (const player of activePlayers) {
        const played = sessionGames.filter((g) => g.players[player])
        if (played.length === 0) continue
        const ranks = played.map((g) => g.players[player].rank)
        const scores = played.map((g) => g.players[player].score)
        playerStats[player] = {
          avgRank: ranks.reduce((a, b) => a + b, 0) / ranks.length,
          totalScore: Math.round(scores.reduce((a, b) => a + b, 0) * 10) / 10,
          games: played.length,
        }
      }
      return {
        label: boundary.date,
        fileName: boundary.fileName,
        totalGames: sessionGames.length,
        playerStats,
      }
    })
  }, [data.bookBoundaries, data.games, activePlayers])

  // ヒートマップ用: データ内の実際の着順レンジを取得して色の幅を最大化
  const rankRange = useMemo(() => {
    const all = heatmapData.flatMap((s) =>
      activePlayers.map((p) => s.playerStats[p]?.avgRank).filter((v): v is number => v !== undefined),
    )
    return all.length > 0
      ? { min: Math.min(...all), max: Math.max(...all) }
      : { min: 1, max: 4 }
  }, [heatmapData, activePlayers])

  const metricLabel = { avgScore: '平均スコア', avgRank: '平均着順', firstRate: '1着率' }[metric]

  return (
    <div className="space-y-6">
      {/* モード切替タブ */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMode('monthly')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            mode === 'monthly' ? 'bg-[#d4af37] text-black font-bold' : 'card hover:border-[#d4af37]/50 text-slate-400'
          }`}
        >
          <BarChart2 className="w-4 h-4" />月次集計
        </button>
        <button
          onClick={() => setMode('heatmap')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            mode === 'heatmap' ? 'bg-[#d4af37] text-black font-bold' : 'card hover:border-[#d4af37]/50 text-slate-400'
          }`}
        >
          <Grid3x3 className="w-4 h-4" />セッション着順
        </button>
      </div>

      {/* ── 月次集計グラフ ── */}
      {mode === 'monthly' && (
        <div className="space-y-5">
          {/* 指標選択 */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-[#d4af37]" />
                <h2 className="font-bold text-lg">月次成績推移</h2>
              </div>
              <div className="flex gap-1">
                {(['avgScore', 'avgRank', 'firstRate'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetric(m)}
                    className={`px-2.5 py-1 rounded text-xs transition-colors ${
                      metric === m ? 'bg-[#d4af37] text-black font-bold' : 'card hover:border-[#d4af37]/50 text-slate-400'
                    }`}
                  >
                    {{ avgScore: '平均スコア', avgRank: '平均着順', firstRate: '1着率' }[m]}
                  </button>
                ))}
              </div>
            </div>

            {monthlyData.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">
                日付付きのデータがありません（ファイル名に日付が含まれていることを確認してください）
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d4a6a" />
                  <XAxis
                    dataKey="month"
                    stroke="#4a6080"
                    tick={{ fill: '#8899aa', fontSize: 10 }}
                    angle={-40}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    stroke="#4a6080"
                    tick={{ fill: '#8899aa', fontSize: 11 }}
                    tickFormatter={metric === 'firstRate' ? (v) => `${v}%` : undefined}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e2d3d', border: '1px solid #2d4a6a', borderRadius: 8 }}
                    labelStyle={{ color: '#d4af37' }}
                    labelFormatter={(v) => `${v}`}
                    formatter={(value: number, name: string) => {
                      const player = name.replace(/_.*$/, '')
                      const suffix = metric === 'firstRate' ? '%' : metric === 'avgRank' ? '着' : 'pt'
                      return [`${value > 0 && metric === 'avgScore' ? '+' : ''}${value.toFixed(metric === 'avgRank' ? 2 : 1)}${suffix}`, player]
                    }}
                  />
                  <Legend
                    formatter={(value: string) => value.replace(/_.*$/, '')}
                    wrapperStyle={{ color: '#8899aa', fontSize: 11 }}
                  />
                  {activePlayers.map((player, i) => (
                    <Bar
                      key={player}
                      dataKey={`${player}_${metric}`}
                      name={`${player}_${metric}`}
                      fill={PLAYER_COLORS[i % PLAYER_COLORS.length]}
                      radius={[2, 2, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 月次サマリーテーブル */}
          {monthlyData.length > 0 && (
            <div className="card p-5">
              <h3 className="font-bold text-base mb-4">{metricLabel}（月次一覧）</h3>
              <div className="overflow-x-auto">
                <table className="text-sm w-full">
                  <thead>
                    <tr className="text-slate-400 text-xs border-b border-[#2d4a6a]">
                      <th className="text-left py-2 px-3">月</th>
                      {activePlayers.map((p) => (
                        <th key={p} className="text-center py-2 px-3">{p}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((row) => (
                      <tr key={String(row.month)} className="border-b border-[#1e2d3d] hover:bg-[#243447]">
                        <td className="py-2 px-3 text-[#d4af37] font-medium flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />{row.month}
                        </td>
                        {activePlayers.map((p) => {
                          const val = row[`${p}_${metric}`] as number | undefined
                          const isPositive = metric === 'avgScore' ? (val ?? 0) > 0 : metric === 'avgRank' ? (val ?? 99) < 2.5 : (val ?? 0) > 25
                          return (
                            <td key={p} className={`py-2 px-3 text-center font-mono text-xs ${
                              val === undefined ? 'text-slate-600' : isPositive ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              {val === undefined ? '-' : metric === 'firstRate' ? `${val.toFixed(1)}%` : metric === 'avgRank' ? val.toFixed(2) : `${val > 0 ? '+' : ''}${val.toFixed(1)}`}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── セッション着順ヒートマップ ── */}
      {mode === 'heatmap' && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Grid3x3 className="w-5 h-5 text-[#d4af37]" />
            <h2 className="font-bold text-lg">セッション別着順ヒートマップ</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4 flex items-center gap-3 flex-wrap">
            <span>各セッション（ブック）でのプレイヤー平均着順を色で表示</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400">良({rankRange.min.toFixed(1)})</span>
              <span className="w-16 h-3 rounded-sm inline-block" style={{
                background: 'linear-gradient(to right, hsl(120,85%,55%), hsl(60,85%,55%), hsl(0,85%,55%))'
              }} />
              <span className="text-[10px] text-slate-400">悪({rankRange.max.toFixed(1)})</span>
              <span className="inline-flex items-center gap-1 ml-2">
                <span className="w-3 h-3 rounded-sm inline-block bg-[#1e2d3d] border border-[#2d4a6a]" />
                <span className="text-xs">不参加</span>
              </span>
            </span>
          </p>

          <div className="overflow-x-auto">
            <table className="text-xs border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-3 text-slate-400 font-normal sticky left-0 bg-[#1e2d3d] z-10 min-w-[90px]">
                    プレイヤー
                  </th>
                  {heatmapData.map((s, i) => (
                    <th
                      key={i}
                      className="text-center py-1 px-1 font-normal text-slate-500 min-w-[52px]"
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 72 }}
                    >
                      {s.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activePlayers.map((player) => (
                  <tr key={player}>
                    <td className="py-1 pr-3 text-slate-300 font-medium sticky left-0 bg-[#1e2d3d] z-10 whitespace-nowrap">
                      {player}
                    </td>
                    {heatmapData.map((session, i) => {
                      const ps = session.playerStats[player]
                      if (!ps) {
                        return (
                          <td key={i} className="p-0.5">
                            <div className="w-[44px] h-[32px] rounded bg-[#162535] border border-[#2d4a6a]/30 flex items-center justify-center text-slate-700">
                              —
                            </div>
                          </td>
                        )
                      }
                      const color = rankToColor(ps.avgRank, rankRange.min, rankRange.max)
                      const scoreStr = `${ps.totalScore > 0 ? '+' : ''}${ps.totalScore.toFixed(1)}`
                      return (
                        <td key={i} className="p-0.5" title={`${player} @ ${session.label}\n平均着順: ${ps.avgRank.toFixed(2)}\n合計スコア: ${scoreStr}\n対局数: ${ps.games}`}>
                          <div
                            className="w-[44px] h-[32px] rounded flex flex-col items-center justify-center cursor-default transition-transform hover:scale-110"
                            style={{ backgroundColor: color.bg, border: `1px solid ${color.border}` }}
                          >
                            <span className="font-bold" style={{ color: color.text }}>{ps.avgRank.toFixed(1)}</span>
                            <span className="text-[9px] opacity-70" style={{ color: color.text }}>{scoreStr}</span>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {heatmapData.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8">データがありません</p>
          )}
        </div>
      )}
    </div>
  )
}
