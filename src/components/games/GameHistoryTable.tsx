import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import type { Game } from '../../types'
import { sortGamesByDate, type SortDirection } from '../../domain/sort'
import { RANK_COLORS } from '../../theme/chartTheme'
import { Pagination } from '../ui/Pagination'
import { PlayerRow, SeatRow } from './GameRows'

interface Props {
  games: Game[]
  /** 指定するとそのプレイヤー視点の表になる */
  player?: string
  pageSize?: number
}

const DEFAULT_PAGE_SIZE = 20
const RANKS = [1, 2, 3, 4]

/** 対局履歴。デフォルトは新しい順 */
export function GameHistoryTable({ games, player, pageSize = DEFAULT_PAGE_SIZE }: Props) {
  const [direction, setDirection] = useState<SortDirection>('desc')
  const [page, setPage] = useState(1)

  const sorted = useMemo(() => sortGamesByDate(games, direction), [games, direction])
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  // 絞り込みで件数が減ったときに空ページを表示しない
  const currentPage = Math.min(page, totalPages)
  const paged = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const rows = paged.map((game, i) => {
    const prev = paged[i - 1]
    return { game, sessionStart: !prev || prev.fileName !== game.fileName }
  })
  // セッション（ブック）ごとに縞模様にする
  let shade = false
  const shadedRows = rows.map((r) => {
    if (r.sessionStart) shade = !shade
    return { ...r, shaded: shade }
  })

  const toggleDirection = () => {
    setDirection((d) => (d === 'desc' ? 'asc' : 'desc'))
    setPage(1)
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-mahjong-border">
        <table className="w-full text-sm">
          <thead className="table-head">
            <tr className="border-b border-mahjong-border">
              <th className="px-3 py-2.5 text-left">
                <button
                  type="button"
                  onClick={toggleDirection}
                  className="inline-flex items-center gap-1 hover:text-white whitespace-nowrap"
                  title="並び順を切り替え"
                >
                  日付
                  {direction === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                  <span className="text-[10px] text-slate-400 font-normal">{direction === 'desc' ? '新しい順' : '古い順'}</span>
                </button>
              </th>
              <th className="px-2 py-2.5 text-center">No</th>
              {player ? (
                <>
                  <th className="px-2 py-2.5 text-center">着順</th>
                  <th className="px-2 py-2.5 text-right">素点</th>
                  <th className="px-3 py-2.5 text-right">スコア</th>
                  <th className="px-3 py-2.5 text-left">同卓者</th>
                </>
              ) : (
                RANKS.map((rank) => (
                  <th key={rank} className="px-3 py-2.5 text-left" style={{ color: RANK_COLORS[rank] }}>
                    {rank}着
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {shadedRows.map(({ game, sessionStart, shaded }) =>
              player ? (
                <PlayerRow key={`${game.fileName}-${game.gameNo}`} game={game} player={player} sessionStart={sessionStart} shaded={shaded} />
              ) : (
                <SeatRow key={`${game.fileName}-${game.gameNo}`} game={game} sessionStart={sessionStart} shaded={shaded} />
              ),
            )}
          </tbody>
        </table>
        {sorted.length === 0 && <p className="text-center text-slate-400 text-sm py-8">対局がありません</p>}
      </div>
      <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
    </div>
  )
}
