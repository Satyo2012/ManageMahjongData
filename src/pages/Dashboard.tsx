import { useMemo } from 'react'
import { Download, Trophy } from 'lucide-react'
import type { MahjongData } from '../types'
import { rankByTotalScore } from '../domain/stats'
import { getDateExtent } from '../domain/filter'
import { exportGamesCsv, exportStatsCsv } from '../utils/csvExport'
import { formatPercent, formatSigned } from '../utils/format'
import { StatCard } from '../components/StatCard'
import { PlayerCard } from '../components/PlayerCard'
import { ScoreTrendCard } from '../components/dashboard/ScoreTrendCard'
import { RankingTable } from '../components/dashboard/RankingTable'

interface Props {
  data: MahjongData
  onSelectPlayer: (name: string) => void
}

export function Dashboard({ data, onSelectPlayer }: Props) {
  const ranking = useMemo(() => rankByTotalScore(data.stats), [data.stats])
  const { minDate, maxDate } = useMemo(() => getDateExtent(data.games), [data.games])
  const leader = ranking[0]

  if (data.games.length === 0) {
    return <p className="text-center text-slate-400 py-16">この期間の対局はありません</p>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="総対局数"
          value={`${data.games.length}局`}
          sub={`${data.bookBoundaries.length}セッション${minDate ? ` · ${minDate} 〜 ${maxDate}` : ''}`}
          color="gold"
        />
        <StatCard label="参加プレイヤー" value={`${ranking.length}名`} color="blue" />
        {leader && (
          <>
            <StatCard label="総合首位" value={leader.name} sub={`${formatSigned(leader.totalScore)} pt`} color="gold" />
            <StatCard
              label="首位の1着率"
              value={formatPercent(leader.firstRate)}
              sub={`${leader.firstCount}回 / ${leader.games}局`}
              color="green"
            />
          </>
        )}
      </div>

      <ScoreTrendCard data={data} />

      <section className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="section-title">
            <Trophy className="w-5 h-5 text-mahjong-gold" />
            プレイヤーランキング
          </h2>
          <span className="text-slate-400 text-xs">カードをクリックで詳細</span>
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={() => exportGamesCsv(data)} className="btn-ghost text-xs">
              <Download className="w-3.5 h-3.5" />
              対局データCSV
            </button>
            <button type="button" onClick={() => exportStatsCsv(data)} className="btn-ghost text-xs">
              <Download className="w-3.5 h-3.5" />
              成績サマリーCSV
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ranking.map((s, i) => (
            <PlayerCard key={s.name} stats={s} rank={i + 1} onClick={() => onSelectPlayer(s.name)} />
          ))}
        </div>
      </section>

      <RankingTable ranking={ranking} onSelectPlayer={onSelectPlayer} />
    </div>
  )
}
