import { useState } from 'react'
import type { MahjongData } from '../types'
import { GameHistoryTable } from '../components/GameHistoryTable'
import { Filter } from 'lucide-react'

interface Props {
  data: MahjongData
}

export function GamesPage({ data }: Props) {
  const [filterPlayer, setFilterPlayer] = useState<string>('')

  const activePlayers = data.players.filter((p) => data.stats[p]?.games > 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter className="w-4 h-4" />
          <span className="text-sm">プレイヤー絞込:</span>
        </div>
        <button
          onClick={() => setFilterPlayer('')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            !filterPlayer ? 'bg-[#d4af37] text-black font-bold' : 'card hover:border-[#d4af37]/50'
          }`}
        >
          全員
        </button>
        {activePlayers.map((p) => (
          <button
            key={p}
            onClick={() => setFilterPlayer(p === filterPlayer ? '' : p)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filterPlayer === p ? 'bg-[#d4af37] text-black font-bold' : 'card hover:border-[#d4af37]/50'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <GameHistoryTable
        games={data.games}
        players={activePlayers}
        filterPlayer={filterPlayer || undefined}
      />
    </div>
  )
}
