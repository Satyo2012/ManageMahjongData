import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import type { HeadToHeadStats } from '../../types'
import { sortGamesByDate, type SortDirection } from '../../domain/sort'
import { formatDate } from '../../domain/date'
import { RankBadge } from '../RankBadge'
import { SignedValue } from '../ui/SignedValue'
import { Pagination } from '../ui/Pagination'
import { H2H_COLORS } from '../../theme/chartTheme'

const PAGE_SIZE = 15

/** 同卓した対局の一覧（デフォルトは新しい順） */
export function H2HHistoryTable({ h2h }: { h2h: HeadToHeadStats }) {
  const { playerA, playerB } = h2h
  const [direction, setDirection] = useState<SortDirection>('desc')
  const [page, setPage] = useState(1)

  const sorted = useMemo(() => sortGamesByDate(h2h.games, direction), [h2h.games, direction])
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="card p-5 space-y-3">
      <h3 className="font-bold text-base">同卓対局履歴</h3>
      <div className="overflow-x-auto rounded-xl border border-mahjong-border">
        <table className="w-full text-sm">
          <thead className="table-head">
            <tr>
              <th className="px-3 py-2.5 text-left" rowSpan={2}>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 hover:text-white whitespace-nowrap"
                  onClick={() => {
                    setDirection((d) => (d === 'desc' ? 'asc' : 'desc'))
                    setPage(1)
                  }}
                >
                  日付
                  {direction === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                </button>
              </th>
              <th className="px-2 py-2.5 text-center" rowSpan={2}>No</th>
              <th className="px-3 pt-2.5 text-center" colSpan={2} style={{ color: H2H_COLORS.a }}>{playerA}</th>
              <th className="px-3 pt-2.5 text-center" colSpan={2} style={{ color: H2H_COLORS.b }}>{playerB}</th>
              <th className="px-3 py-2.5 text-center" rowSpan={2}>結果</th>
            </tr>
            <tr className="border-b border-mahjong-border text-slate-400">
              <th className="px-2 pb-1.5 text-center font-normal">着順</th>
              <th className="px-2 pb-1.5 text-right font-normal">スコア</th>
              <th className="px-2 pb-1.5 text-center font-normal">着順</th>
              <th className="px-2 pb-1.5 text-right font-normal">スコア</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((game, idx) => {
              const a = game.players[playerA]
              const b = game.players[playerB]
              const winner = a.rank < b.rank ? playerA : b.rank < a.rank ? playerB : undefined
              return (
                <tr
                  key={`${game.fileName}-${game.gameNo}`}
                  className={`border-t border-mahjong-border/40 hover:bg-mahjong-hover ${idx % 2 === 0 ? 'bg-mahjong-row' : 'bg-mahjong-card'}`}
                >
                  <td className="px-3 py-2 text-xs whitespace-nowrap text-slate-200 tabular-nums" title={game.fileName}>{formatDate(game.date)}</td>
                  <td className="px-2 py-2 text-center font-mono text-xs text-slate-300">{game.gameNo}</td>
                  <td className="px-2 py-2 text-center"><RankBadge rank={a.rank} size="sm" /></td>
                  <td className="px-2 py-2 text-right"><SignedValue value={a.score} className="text-xs font-semibold" /></td>
                  <td className="px-2 py-2 text-center"><RankBadge rank={b.rank} size="sm" /></td>
                  <td className="px-2 py-2 text-right"><SignedValue value={b.score} className="text-xs font-semibold" /></td>
                  <td className="px-3 py-2 text-center text-xs font-bold whitespace-nowrap">
                    {winner ? (
                      <span style={{ color: winner === playerA ? H2H_COLORS.a : H2H_COLORS.b }}>{winner} 勝</span>
                    ) : (
                      <span className="text-slate-400">引分</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
    </div>
  )
}
