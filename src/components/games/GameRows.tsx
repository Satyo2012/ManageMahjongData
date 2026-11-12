import clsx from 'clsx'
import type { Game } from '../../types'
import { seatsByRank } from '../../domain/sort'
import { formatDate } from '../../domain/date'
import { shortFileName } from '../../utils/format'
import { RankBadge } from '../RankBadge'
import { PlayerName } from '../ui/PlayerName'
import { SignedValue } from '../ui/SignedValue'

export interface RowProps {
  game: Game
  /** 前の行と別セッション（ブック）なら true。区切り線を太くする */
  sessionStart: boolean
  /** セッション単位の縞模様 */
  shaded: boolean
}

function rowClass({ sessionStart, shaded }: RowProps) {
  return clsx(
    'hover:bg-mahjong-hover transition-colors',
    shaded ? 'bg-mahjong-row' : 'bg-mahjong-card',
    sessionStart ? 'border-t-2 border-mahjong-border' : 'border-t border-mahjong-border/40',
  )
}

function DateCells({ game }: { game: Game }) {
  return (
    <>
      <td className="px-3 py-2 whitespace-nowrap text-xs" title={game.fileName}>
        {game.date ? (
          <span className="text-slate-200 tabular-nums">{game.date}</span>
        ) : (
          <span className="text-amber-400/90">
            {formatDate(undefined)}
            <span className="block text-[10px] text-slate-400 max-w-[8rem] truncate">{shortFileName(game.fileName)}</span>
          </span>
        )}
      </td>
      <td className="px-2 py-2 text-center font-mono text-xs text-slate-300 tabular-nums">{game.gameNo}</td>
    </>
  )
}

/** 全員表示: 1着〜4着の列に名前とスコア */
export function SeatRow(props: RowProps) {
  const seats = seatsByRank(props.game)
  return (
    <tr className={rowClass(props)}>
      <DateCells game={props.game} />
      {seats.map((seat) => (
        <td key={seat.name} className="px-3 py-2">
          <div className="flex items-center justify-between gap-2 min-w-[9rem]">
            <PlayerName name={seat.name} className="text-sm text-slate-100" />
            <SignedValue value={seat.score} className="text-xs font-semibold" />
          </div>
        </td>
      ))}
    </tr>
  )
}

/** プレイヤー指定: そのプレイヤーの着順・素点・スコアと同卓者 */
export function PlayerRow({ player, ...props }: RowProps & { player: string }) {
  const result = props.game.players[player]
  const others = seatsByRank(props.game).filter((s) => s.name !== player)
  if (!result) return null
  return (
    <tr className={rowClass(props)}>
      <DateCells game={props.game} />
      <td className="px-2 py-2 text-center">
        <RankBadge rank={result.rank} size="sm" />
      </td>
      <td className="px-2 py-2 text-right font-mono text-xs text-slate-300 tabular-nums">{result.points.toLocaleString()}</td>
      <td className="px-3 py-2 text-right">
        <SignedValue value={result.score} className="text-sm font-semibold" />
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-300">
          {others.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1 whitespace-nowrap">
              <span className="text-slate-400">{s.rank}着</span>
              <PlayerName name={s.name} />
            </span>
          ))}
        </div>
      </td>
    </tr>
  )
}
