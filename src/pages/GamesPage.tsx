import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Filter } from 'lucide-react'
import type { MahjongData } from '../types'
import { GameHistoryTable } from '../components/games/GameHistoryTable'
import { PlayerName } from '../components/ui/PlayerName'

interface Props {
  data: MahjongData
}

export function GamesPage({ data }: Props) {
  const [player, setPlayer] = useState('')
  // 期間を変えて選択中のプレイヤーがいなくなったら全員表示に戻す
  const selected = data.players.includes(player) ? player : ''
  const games = useMemo(
    () => (selected ? data.games.filter((g) => g.players[selected]) : data.games),
    [data.games, selected],
  )

  const chip = (active: boolean) =>
    clsx(
      'px-3 py-1 rounded-full text-sm border transition-colors',
      active ? 'bg-mahjong-gold text-black font-bold border-mahjong-gold' : 'border-mahjong-border text-slate-200 hover:border-mahjong-gold/50',
    )

  return (
    <div className="space-y-4">
      {/* スマホでは横スクロール、PC では折り返し */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible [&>*]:shrink-0">
        <span className="flex items-center gap-1.5 text-slate-300 text-sm mr-1">
          <Filter className="w-4 h-4" />
          プレイヤー
        </span>
        <button type="button" onClick={() => setPlayer('')} className={chip(!selected)}>
          全員
        </button>
        {data.players.map((p) => (
          <button key={p} type="button" onClick={() => setPlayer(p === selected ? '' : p)} className={chip(selected === p)}>
            {selected === p ? p : <PlayerName name={p} />}
          </button>
        ))}
        <span className="ml-auto text-sm text-slate-400 whitespace-nowrap">{games.length}局</span>
      </div>

      <GameHistoryTable key={selected} games={games} player={selected || undefined} />
    </div>
  )
}
