import { useState, useMemo } from 'react'
import type { MahjongData } from '../types'
import { computeHeadToHead } from '../utils/excelParser'
import { RankBadge } from '../components/RankBadge'
import { Swords, ChevronDown, ChevronUp } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface Props {
  data: MahjongData
}

const PLAYER_COLORS = ['#60a5fa', '#f472b6', '#34d399', '#fb923c', '#a78bfa', '#facc15']

export function HeadToHead({ data }: Props) {
  const activePlayers = data.players.filter((p) => data.stats[p]?.games > 0)
  const [playerA, setPlayerA] = useState<string>(activePlayers[0] ?? '')
  const [playerB, setPlayerB] = useState<string>(activePlayers[1] ?? '')
  const [sortAsc, setSortAsc] = useState(true)
  const [page, setPage] = useState(1)
  const perPage = 15

  const h2h = useMemo(() => {
    if (!playerA || !playerB || playerA === playerB) return null
    return computeHeadToHead(playerA, playerB, data.games)
  }, [playerA, playerB, data.games])

  const sortedGames = useMemo(() => {
    if (!h2h) return []
    return sortAsc ? [...h2h.games] : [...h2h.games].reverse()
  }, [h2h, sortAsc])

  const totalPages = Math.ceil(sortedGames.length / perPage)
  const pagedGames = sortedGames.slice((page - 1) * perPage, page * perPage)

  const rankChartData = useMemo(() => {
    if (!h2h) return []
    return [
      {
        name: '1着',
        [playerA]: h2h.playerAFirstCount,
        [playerB]: h2h.playerBFirstCount,
      },
      {
        name: '勝利数\n(相手より上位)',
        [playerA]: h2h.playerAWins,
        [playerB]: h2h.playerBWins,
      },
    ]
  }, [h2h, playerA, playerB])

  const scoreChartData = useMemo(() => {
    if (!h2h || !h2h.games.length) return []
    let cumA = 0
    let cumB = 0
    return h2h.games.map((g, i) => {
      cumA += g.players[playerA].score
      cumB += g.players[playerB].score
      return {
        game: i + 1,
        [playerA]: Math.round(cumA * 10) / 10,
        [playerB]: Math.round(cumB * 10) / 10,
      }
    })
  }, [h2h, playerA, playerB])

  return (
    <div className="space-y-6">
      {/* プレイヤー選択 */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Swords className="w-5 h-5 text-[#d4af37]" />
          <h2 className="font-bold text-lg">直対戦績 — プレイヤー選択</h2>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <select
            value={playerA}
            onChange={(e) => { setPlayerA(e.target.value); setPage(1) }}
            className="bg-[#162535] border border-[#2d4a6a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#d4af37] min-w-[140px]"
          >
            <option value="">選択してください</option>
            {activePlayers.map((p) => (
              <option key={p} value={p} disabled={p === playerB}>
                {p}
              </option>
            ))}
          </select>

          <span className="text-2xl text-[#d4af37] font-bold">VS</span>

          <select
            value={playerB}
            onChange={(e) => { setPlayerB(e.target.value); setPage(1) }}
            className="bg-[#162535] border border-[#2d4a6a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#d4af37] min-w-[140px]"
          >
            <option value="">選択してください</option>
            {activePlayers.map((p) => (
              <option key={p} value={p} disabled={p === playerA}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!h2h && (
        <div className="text-center text-slate-500 py-12">
          対戦するプレイヤーを2人選択してください
        </div>
      )}

      {h2h && h2h.totalGames === 0 && (
        <div className="text-center text-slate-500 py-12">
          {playerA} と {playerB} が同卓したゲームは見つかりませんでした
        </div>
      )}

      {h2h && h2h.totalGames > 0 && (
        <>
          {/* サマリーカード */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 総対局数 */}
            <div className="card p-4 text-center">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">同卓局数</p>
              <p className="text-4xl font-bold text-white">{h2h.totalGames}</p>
              <p className="text-slate-500 text-xs mt-1">局</p>
            </div>

            {/* 対戦成績 */}
            <div className="card p-4 col-span-1 md:col-span-2">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-3 text-center">
                対戦成績（相手より上位着順）
              </p>
              <div className="flex items-center gap-3">
                {/* Player A */}
                <div className="flex-1 text-center">
                  <p className="font-bold text-blue-400 text-lg truncate">{playerA}</p>
                  <p className="text-4xl font-bold text-white mt-1">{h2h.playerAWins}</p>
                  <p className="text-slate-400 text-sm mt-1">{h2h.playerAWinRate.toFixed(1)}%</p>
                </div>

                {/* バーグラフ */}
                <div className="flex-1 flex gap-1 h-12 items-end">
                  {h2h.totalGames > 0 && (
                    <>
                      <div
                        className="bg-blue-500 rounded-t transition-all"
                        style={{ flex: h2h.playerAWins, minWidth: h2h.playerAWins > 0 ? 4 : 0, height: `${Math.max((h2h.playerAWins / h2h.totalGames) * 100, 4)}%` }}
                      />
                      <div
                        className="bg-pink-500 rounded-t transition-all"
                        style={{ flex: h2h.playerBWins, minWidth: h2h.playerBWins > 0 ? 4 : 0, height: `${Math.max((h2h.playerBWins / h2h.totalGames) * 100, 4)}%` }}
                      />
                    </>
                  )}
                </div>

                {/* Player B */}
                <div className="flex-1 text-center">
                  <p className="font-bold text-pink-400 text-lg truncate">{playerB}</p>
                  <p className="text-4xl font-bold text-white mt-1">{h2h.playerBWins}</p>
                  <p className="text-slate-400 text-sm mt-1">{h2h.playerBWinRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* 詳細スタッツ比較 */}
          <div className="card p-5">
            <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4">スタッツ比較</h3>
            <div className="space-y-3">
              {[
                {
                  label: '平均着順',
                  aVal: h2h.playerAAvgRank.toFixed(2),
                  bVal: h2h.playerBAvgRank.toFixed(2),
                  aBetter: h2h.playerAAvgRank < h2h.playerBAvgRank,
                },
                {
                  label: '平均スコア',
                  aVal: `${h2h.playerAAvgScore > 0 ? '+' : ''}${h2h.playerAAvgScore.toFixed(2)}`,
                  bVal: `${h2h.playerBAvgScore > 0 ? '+' : ''}${h2h.playerBAvgScore.toFixed(2)}`,
                  aBetter: h2h.playerAAvgScore > h2h.playerBAvgScore,
                },
                {
                  label: '1着回数',
                  aVal: `${h2h.playerAFirstCount}回`,
                  bVal: `${h2h.playerBFirstCount}回`,
                  aBetter: h2h.playerAFirstCount > h2h.playerBFirstCount,
                },
                {
                  label: 'トップ率 (同卓時)',
                  aVal: `${h2h.totalGames > 0 ? ((h2h.playerAFirstCount / h2h.totalGames) * 100).toFixed(1) : '0.0'}%`,
                  bVal: `${h2h.totalGames > 0 ? ((h2h.playerBFirstCount / h2h.totalGames) * 100).toFixed(1) : '0.0'}%`,
                  aBetter: h2h.playerAFirstCount >= h2h.playerBFirstCount,
                },
              ].map(({ label, aVal, bVal, aBetter }) => (
                <div key={label} className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                  <div className={`text-right font-mono font-semibold ${aBetter ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {aBetter && <span className="text-emerald-400 mr-1">▲</span>}
                    {aVal}
                  </div>
                  <div className="text-center text-xs text-slate-500 w-24">{label}</div>
                  <div className={`text-left font-mono font-semibold ${!aBetter ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {!aBetter && <span className="text-emerald-400 mr-1">▲</span>}
                    {bVal}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 累積スコア推移グラフ */}
          {scoreChartData.length > 0 && (
            <div className="card p-5">
              <h3 className="font-bold text-base mb-4">同卓時累積スコア推移</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={rankChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d4a6a" />
                  <XAxis dataKey="name" stroke="#4a6080" tick={{ fill: '#8899aa', fontSize: 11 }} />
                  <YAxis stroke="#4a6080" tick={{ fill: '#8899aa', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e2d3d', border: '1px solid #2d4a6a', borderRadius: 8 }}
                    labelStyle={{ color: '#d4af37' }}
                  />
                  <Legend />
                  <Bar dataKey={playerA} fill={PLAYER_COLORS[0]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey={playerB} fill={PLAYER_COLORS[1]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              <h3 className="font-bold text-base mb-4 mt-6">同卓時累積スコア推移</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={scoreChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d4a6a" />
                  <XAxis dataKey="game" stroke="#4a6080" tick={{ fill: '#8899aa', fontSize: 11 }} label={{ value: '対局', position: 'insideBottomRight', offset: -5, fill: '#8899aa', fontSize: 10 }} />
                  <YAxis stroke="#4a6080" tick={{ fill: '#8899aa', fontSize: 11 }} />
                  <ReferenceLine y={0} stroke="#4a6080" strokeDasharray="4 4" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e2d3d', border: '1px solid #2d4a6a', borderRadius: 8 }}
                    labelFormatter={(v) => `${v}局目`}
                    labelStyle={{ color: '#d4af37' }}
                  />
                  <Legend />
                  <Bar dataKey={playerA} fill={PLAYER_COLORS[0]} radius={[2, 2, 0, 0]} />
                  <Bar dataKey={playerB} fill={PLAYER_COLORS[1]} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 対局履歴テーブル */}
          <div className="card p-5">
            <h3 className="font-bold text-base mb-4">同卓対局履歴</h3>
            <div className="overflow-x-auto rounded-xl border border-[#2d4a6a]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#162535] text-slate-400 text-xs uppercase tracking-wider">
                    <th className="px-3 py-3 text-left">
                      <button
                        className="flex items-center gap-1 hover:text-white transition-colors"
                        onClick={() => { setSortAsc(!sortAsc); setPage(1) }}
                      >
                        対局No
                        {sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </th>
                    <th className="px-2 py-3 text-left text-xs text-slate-500">ファイル</th>
                    <th className="px-3 py-3 text-center text-blue-400" colSpan={2}>{playerA}</th>
                    <th className="px-3 py-3 text-center text-pink-400" colSpan={2}>{playerB}</th>
                    <th className="px-3 py-3 text-center text-slate-400">結果</th>
                  </tr>
                  <tr className="bg-[#162535] border-b border-[#2d4a6a] text-slate-500 text-xs">
                    <th /><th />
                    <th className="px-2 py-1 text-center">着順</th>
                    <th className="px-2 py-1 text-center">スコア</th>
                    <th className="px-2 py-1 text-center">着順</th>
                    <th className="px-2 py-1 text-center">スコア</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {pagedGames.map((game, idx) => {
                    const rA = game.players[playerA]
                    const rB = game.players[playerB]
                    const aWon = rA.rank < rB.rank
                    const bWon = rB.rank < rA.rank

                    return (
                      <tr
                        key={`${game.fileName}-${game.gameNo}`}
                        className={`border-b border-[#1e2d3d] hover:bg-[#243447] transition-colors ${
                          idx % 2 === 0 ? 'bg-[#1a2838]' : 'bg-[#1e2d3d]'
                        }`}
                      >
                        <td className="px-3 py-2 font-mono text-slate-300">{game.gameNo}</td>
                        <td className="px-2 py-2 text-slate-500 text-xs max-w-[90px] truncate" title={game.fileName}>
                          {game.fileName.replace('麻雀集計表', '').replace('.xlsx', '')}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <RankBadge rank={rA.rank} size="sm" />
                        </td>
                        <td className={`px-2 py-2 text-center font-mono text-xs font-semibold ${
                          rA.score > 0 ? 'text-emerald-400' : rA.score < 0 ? 'text-red-400' : 'text-slate-400'
                        }`}>
                          {rA.score > 0 ? '+' : ''}{rA.score.toFixed(1)}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <RankBadge rank={rB.rank} size="sm" />
                        </td>
                        <td className={`px-2 py-2 text-center font-mono text-xs font-semibold ${
                          rB.score > 0 ? 'text-emerald-400' : rB.score < 0 ? 'text-red-400' : 'text-slate-400'
                        }`}>
                          {rB.score > 0 ? '+' : ''}{rB.score.toFixed(1)}
                        </td>
                        <td className="px-3 py-2 text-center text-xs font-bold">
                          {aWon ? (
                            <span className="text-blue-400">{playerA} 勝</span>
                          ) : bWon ? (
                            <span className="text-pink-400">{playerB} 勝</span>
                          ) : (
                            <span className="text-slate-500">引分</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded card text-sm disabled:opacity-40 hover:border-[#d4af37]/50 transition-colors"
                >
                  前へ
                </button>
                <span className="text-sm text-slate-400">{page} / {totalPages} ページ</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded card text-sm disabled:opacity-40 hover:border-[#d4af37]/50 transition-colors"
                >
                  次へ
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
