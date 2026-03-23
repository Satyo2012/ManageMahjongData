import { useState } from 'react'
import type { Game } from '../types'
import { RankBadge } from './RankBadge'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface Props {
  games: Game[]
  players: string[]
  filterPlayer?: string
}

export function GameHistoryTable({ games, players, filterPlayer }: Props) {
  const [page, setPage] = useState(1)
  const [sortAsc, setSortAsc] = useState(true)
  const perPage = 20

  const visiblePlayers = filterPlayer ? [filterPlayer] : players.filter((p) =>
    games.some((g) => g.players[p]),
  )

  const sorted = sortAsc ? [...games] : [...games].reverse()
  const total = sorted.length
  const paged = sorted.slice((page - 1) * perPage, page * perPage)
  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-3">
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
              {visiblePlayers.map((p) => (
                <th key={p} className="px-3 py-3 text-center" colSpan={2}>
                  {p}
                </th>
              ))}
            </tr>
            <tr className="bg-[#162535] border-b border-[#2d4a6a] text-slate-500 text-xs">
              <th />
              <th />
              {visiblePlayers.map((p) => (
                <>
                  <th key={`${p}-rank`} className="px-2 py-1 text-center">着順</th>
                  <th key={`${p}-score`} className="px-2 py-1 text-center">スコア</th>
                </>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((game, idx) => (
              <tr
                key={`${game.fileName}-${game.gameNo}`}
                className={`border-b border-[#1e2d3d] hover:bg-[#243447] transition-colors ${
                  idx % 2 === 0 ? 'bg-[#1a2838]' : 'bg-[#1e2d3d]'
                }`}
              >
                <td className="px-3 py-2 font-mono text-slate-300">{game.gameNo}</td>
                <td className="px-2 py-2 text-slate-500 text-xs max-w-[100px] truncate" title={game.fileName}>
                  {game.fileName.replace('麻雀集計表', '').replace('.xlsx', '')}
                </td>
                {visiblePlayers.map((p) => {
                  const r = game.players[p]
                  if (!r) {
                    return (
                      <>
                        <td key={`${p}-rank`} className="px-2 py-2 text-center text-slate-600">-</td>
                        <td key={`${p}-score`} className="px-2 py-2 text-center text-slate-600">-</td>
                      </>
                    )
                  }
                  return (
                    <>
                      <td key={`${p}-rank`} className="px-2 py-2 text-center">
                        <RankBadge rank={r.rank} size="sm" />
                      </td>
                      <td
                        key={`${p}-score`}
                        className={`px-2 py-2 text-center font-mono text-xs font-semibold ${
                          r.score > 0 ? 'text-emerald-400' : r.score < 0 ? 'text-red-400' : 'text-slate-400'
                        }`}
                      >
                        {r.score > 0 ? '+' : ''}{r.score.toFixed(1)}
                      </td>
                    </>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded card text-sm disabled:opacity-40 hover:border-[#d4af37]/50 transition-colors"
          >
            前へ
          </button>
          <span className="text-sm text-slate-400">
            {page} / {totalPages} ページ
          </span>
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
  )
}
