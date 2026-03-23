import type { MahjongData } from '../types'
import { PlayerCard } from '../components/PlayerCard'
import { ScoreTimelineChart } from '../components/ScoreTimelineChart'
import { StatCard } from '../components/StatCard'
import { Trophy, TrendingUp, Users, Gamepad2 } from 'lucide-react'

interface Props {
  data: MahjongData
  onSelectPlayer: (name: string) => void
}

export function Dashboard({ data, onSelectPlayer }: Props) {
  const statsArr = data.players
    .map((p) => data.stats[p])
    .filter((s) => s && s.games > 0)
    .sort((a, b) => b.totalScore - a.totalScore)

  const leader = statsArr[0]
  const totalGames = data.games.length
  const activePlayers = statsArr.length
  const bookCount = data.bookBoundaries.length

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="総対局数"
          value={totalGames}
          sub={`${bookCount}ブック`}
          color="gold"
        />
        <StatCard label="参加プレイヤー" value={`${activePlayers}名`} color="blue" />
        {leader && (
          <>
            <StatCard
              label="総合首位"
              value={leader.name}
              sub={`${leader.totalScore > 0 ? '+' : ''}${leader.totalScore.toFixed(1)} pt`}
              color="gold"
            />
            <StatCard
              label="首位の1着率"
              value={`${leader.firstRate.toFixed(1)}%`}
              sub={`${leader.firstCount}回 / ${leader.games}局`}
              color="green"
            />
          </>
        )}
      </div>

      {/* 累積スコア推移（共有タイムライン） */}
      {statsArr.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#d4af37]" />
              <h2 className="font-bold text-lg">累積スコア推移</h2>
            </div>
            {bookCount > 1 && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <span className="inline-block w-6 h-px border-t border-dashed border-[#d4af37] opacity-70" />
                = ブック境界
              </span>
            )}
          </div>
          <ScoreTimelineChart
            games={data.games}
            playerNames={statsArr.map((s) => s.name)}
            bookBoundaries={data.bookBoundaries}
          />
        </div>
      )}

      {/* Player Rankings */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-[#d4af37]" />
          <h2 className="font-bold text-lg">プレイヤーランキング</h2>
          <span className="text-slate-500 text-sm ml-auto flex items-center gap-1">
            <Users className="w-4 h-4" />
            クリックで詳細表示
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {statsArr.map((s, i) => (
            <PlayerCard key={s.name} stats={s} rank={i + 1} onClick={() => onSelectPlayer(s.name)} />
          ))}
        </div>
      </div>

      {/* Rank Distribution Overview */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Gamepad2 className="w-5 h-5 text-[#d4af37]" />
          <h2 className="font-bold text-lg">着順分布比較</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-xs uppercase border-b border-[#2d4a6a]">
                <th className="text-left py-2 px-3">プレイヤー</th>
                <th className="text-center py-2 px-2">対局</th>
                <th className="text-center py-2 px-2">合計PT</th>
                <th className="text-center py-2 px-2">平均着</th>
                <th className="text-center py-2 px-2">1着</th>
                <th className="text-center py-2 px-2">2着</th>
                <th className="text-center py-2 px-2">3着</th>
                <th className="text-center py-2 px-2">4着</th>
                <th className="text-center py-2 px-2">トップ率</th>
                <th className="text-center py-2 px-2">飛び率</th>
              </tr>
            </thead>
            <tbody>
              {statsArr.map((s, i) => (
                <tr
                  key={s.name}
                  onClick={() => onSelectPlayer(s.name)}
                  className="border-b border-[#1e2d3d] hover:bg-[#243447] cursor-pointer transition-colors"
                >
                  <td className="py-2 px-3 font-medium">
                    <span className="mr-2 text-slate-500">#{i + 1}</span>
                    {s.name}
                  </td>
                  <td className="py-2 px-2 text-center text-slate-300">{s.games}</td>
                  <td className={`py-2 px-2 text-center font-mono font-semibold ${s.totalScore > 0 ? 'text-emerald-400' : s.totalScore < 0 ? 'text-red-400' : 'text-slate-300'}`}>
                    {s.totalScore > 0 ? '+' : ''}{s.totalScore.toFixed(1)}
                  </td>
                  <td className="py-2 px-2 text-center text-slate-300">{s.avgRank.toFixed(2)}</td>
                  <td className="py-2 px-2 text-center text-yellow-400">{s.firstRate.toFixed(1)}%</td>
                  <td className="py-2 px-2 text-center text-slate-300">{s.secondRate.toFixed(1)}%</td>
                  <td className="py-2 px-2 text-center text-amber-600">{s.thirdRate.toFixed(1)}%</td>
                  <td className="py-2 px-2 text-center text-red-400">{s.fourthRate.toFixed(1)}%</td>
                  <td className="py-2 px-2 text-center text-blue-400">{s.topRate.toFixed(1)}%</td>
                  <td className="py-2 px-2 text-center text-purple-400">{s.flyingRate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
