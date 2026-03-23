import { useMemo, useState } from 'react'
import type { MahjongData } from '../types'
import { computeStats } from '../utils/excelParser'
import { exportGamesCsv, exportStatsCsv } from '../utils/csvExport'
import { PlayerCard } from '../components/PlayerCard'
import { ScoreLineChart } from '../components/ScoreLineChart'
import { ScoreTimelineChart } from '../components/ScoreTimelineChart'
import { StatCard } from '../components/StatCard'
import { DateRangeFilter, type DateRange } from '../components/DateRangeFilter'
import { Trophy, TrendingUp, Users, Gamepad2, Download, ChevronDown } from 'lucide-react'

interface Props {
  data: MahjongData
  onSelectPlayer: (name: string) => void
}

type ChartMode = 'count' | 'timeline'

export function Dashboard({ data, onSelectPlayer }: Props) {
  const [chartMode, setChartMode] = useState<ChartMode>('count')
  const [dateRange, setDateRange] = useState<DateRange>({ start: '', end: '' })
  const [showExport, setShowExport] = useState(false)

  // 期間フィルター適用後のデータを計算
  const filtered = useMemo(() => {
    const hasFilter = dateRange.start || dateRange.end
    if (!hasFilter) return data

    const games = data.games.filter((g) => {
      if (!g.date) return true
      if (dateRange.start && g.date < dateRange.start) return false
      if (dateRange.end && g.date > dateRange.end) return false
      return true
    })
    const stats = computeStats(data.players, games)
    const bookBoundaries = data.bookBoundaries.filter((b) => {
      if (dateRange.start && b.date !== '日付不明' && b.date < dateRange.start) return false
      if (dateRange.end && b.date !== '日付不明' && b.date > dateRange.end) return false
      return true
    })
    return { ...data, games, stats, bookBoundaries }
  }, [data, dateRange])

  const statsArr = filtered.players
    .map((p) => filtered.stats[p])
    .filter((s) => s && s.games > 0)
    .sort((a, b) => b.totalScore - a.totalScore)

  const leader = statsArr[0]
  const totalGames = filtered.games.length
  const activePlayers = statsArr.length
  const bookCount = filtered.bookBoundaries.length

  // 日付の最小・最大を取得（フィルター入力用）
  const { minDate, maxDate } = useMemo(() => {
    const dates = data.games.map((g) => g.date).filter(Boolean) as string[]
    return {
      minDate: dates.length > 0 ? dates.reduce((a, b) => (a < b ? a : b)) : undefined,
      maxDate: dates.length > 0 ? dates.reduce((a, b) => (a > b ? a : b)) : undefined,
    }
  }, [data.games])

  const isFiltered = dateRange.start || dateRange.end

  return (
    <div className="space-y-6">
      {/* 期間フィルター */}
      <DateRangeFilter
        range={dateRange}
        onChange={setDateRange}
        minDate={minDate}
        maxDate={maxDate}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="総対局数"
          value={totalGames}
          sub={isFiltered ? 'フィルター適用中' : `${bookCount}ブック`}
          color={isFiltered ? 'blue' : 'gold'}
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

      {/* 累積スコアチャート */}
      {statsArr.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#d4af37]" />
              <h2 className="font-bold text-lg">累積スコア推移</h2>
            </div>

            {/* チャートモード切替 */}
            <div className="flex items-center gap-1 bg-[#162535] rounded-lg p-1">
              <button
                onClick={() => setChartMode('count')}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  chartMode === 'count'
                    ? 'bg-[#d4af37] text-black font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                打数（人別）
              </button>
              <button
                onClick={() => setChartMode('timeline')}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  chartMode === 'timeline'
                    ? 'bg-[#d4af37] text-black font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                日付（全体）
              </button>
            </div>
          </div>

          {chartMode === 'count' ? (
            <ScoreLineChart players={statsArr} />
          ) : (
            <ScoreTimelineChart
              games={filtered.games}
              playerNames={statsArr.map((s) => s.name)}
              bookBoundaries={filtered.bookBoundaries}
            />
          )}
        </div>
      )}

      {/* プレイヤーランキング */}
      <div>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Trophy className="w-5 h-5 text-[#d4af37]" />
          <h2 className="font-bold text-lg">プレイヤーランキング</h2>
          <span className="text-slate-500 text-sm ml-auto flex items-center gap-1">
            <Users className="w-4 h-4" />
            クリックで詳細表示
          </span>

          {/* CSVエクスポート */}
          <div className="relative">
            <button
              onClick={() => setShowExport((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs card hover:border-[#d4af37]/50 text-slate-400 hover:text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              CSV出力
              <ChevronDown className="w-3 h-3" />
            </button>
            {showExport && (
              <div className="absolute right-0 top-full mt-1 card rounded-lg overflow-hidden z-20 min-w-[160px] shadow-xl">
                <button
                  onClick={() => { exportGamesCsv(filtered); setShowExport(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-[#243447] transition-colors"
                >
                  📋 対局データ CSV
                </button>
                <button
                  onClick={() => { exportStatsCsv(filtered); setShowExport(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-[#243447] transition-colors border-t border-[#2d4a6a]"
                >
                  📊 成績サマリー CSV
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {statsArr.map((s, i) => (
            <PlayerCard key={s.name} stats={s} rank={i + 1} onClick={() => onSelectPlayer(s.name)} />
          ))}
        </div>
      </div>

      {/* 着順分布比較テーブル */}
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
                <th className="text-center py-2 px-2">連帯率</th>
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
