import type { MahjongData } from '../types'
import { StatCard } from '../components/StatCard'
import { ScoreLineChart } from '../components/ScoreLineChart'
import { RankDistributionChart } from '../components/RankDistributionChart'
import { RollingWinRateChart } from '../components/RollingWinRateChart'
import { GameHistoryTable } from '../components/GameHistoryTable'
import { ArrowLeft, TrendingUp, BarChart2, List, Activity } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts'

interface Props {
  playerName: string
  data: MahjongData
  onBack: () => void
}

const PLAYER_COLORS = [
  '#d4af37', '#4ade80', '#60a5fa', '#f87171',
  '#a78bfa', '#fb923c', '#34d399', '#f472b6',
]

export function PlayerDetail({ playerName, data, onBack }: Props) {
  const stats = data.stats[playerName]
  if (!stats) return null

  const playerIndex = data.players.indexOf(playerName)
  const playerColor = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length]

  const scoreData = stats.scoreHistory.map((s, i) => ({
    game: stats.gameIndices[i],
    score: s,
    cumulative: stats.cumulativeScoreHistory[i],
  }))

  const scoreColor =
    stats.totalScore > 0 ? 'text-emerald-400' : stats.totalScore < 0 ? 'text-red-400' : 'text-slate-300'

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>戻る</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold">{playerName}</h1>
          <p className="text-slate-400 text-sm">{stats.games}局の戦績</p>
        </div>
        <div className="ml-auto">
          <span className={`text-3xl font-bold ${scoreColor}`}>
            {stats.totalScore > 0 ? '+' : ''}{stats.totalScore.toFixed(1)}
          </span>
          <span className="text-slate-400 text-sm ml-1">pt</span>
        </div>
      </div>

      {/* 主要スタッツ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="対局数" value={stats.games} color="blue" />
        <StatCard
          label="平均着順"
          value={stats.avgRank.toFixed(3)}
          sub="目標: 2.500以下"
          color={stats.avgRank < 2.5 ? 'green' : 'red'}
        />
        <StatCard
          label="平均スコア"
          value={`${stats.avgScore > 0 ? '+' : ''}${stats.avgScore.toFixed(2)}`}
          color={stats.avgScore > 0 ? 'green' : 'red'}
        />
        <StatCard
          label="連帯率"
          value={`${stats.topRate.toFixed(1)}%`}
          sub={`1着${stats.firstRate.toFixed(1)}% / 2着${stats.secondRate.toFixed(1)}%`}
          color="gold"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="1着回数" value={`${stats.firstCount}回`} sub={`${stats.firstRate.toFixed(1)}%`} color="gold" />
        <StatCard label="2着回数" value={`${stats.secondCount}回`} sub={`${stats.secondRate.toFixed(1)}%`} />
        <StatCard label="3着回数" value={`${stats.thirdCount}回`} sub={`${stats.thirdRate.toFixed(1)}%`} />
        <StatCard
          label="4着回数"
          value={`${stats.fourthCount}回`}
          sub={`飛び${stats.flyingCount}回 (${stats.flyingRate.toFixed(1)}%)`}
          color={stats.fourthRate > 30 ? 'red' : 'default'}
        />
      </div>

      {/* 累積スコア推移 */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[#d4af37]" />
          <h2 className="font-bold text-lg">累積スコア推移</h2>
        </div>
        <ScoreLineChart players={[stats]} />
      </div>

      {/* 各対局スコア */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-5 h-5 text-[#d4af37]" />
          <h2 className="font-bold text-lg">各対局スコア</h2>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={scoreData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d4a6a" />
            <XAxis dataKey="game" stroke="#4a6080" tick={{ fill: '#8899aa', fontSize: 11 }} />
            <YAxis stroke="#4a6080" tick={{ fill: '#8899aa', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e2d3d', border: '1px solid #2d4a6a', borderRadius: 8 }}
              labelFormatter={(v) => `対局 #${v}`}
              formatter={(value: number) => [
                `${value > 0 ? '+' : ''}${value.toFixed(1)}`, 'スコア',
              ]}
              labelStyle={{ color: '#d4af37' }}
            />
            <ReferenceLine y={0} stroke="#4a6080" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="score"
              stroke={playerColor}
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props as { cx: number; cy: number; payload: { score: number } }
                return (
                  <circle
                    key={`dot-${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={3}
                    fill={payload.score >= 0 ? '#34d399' : '#f87171'}
                    stroke="none"
                  />
                )
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ローリング勝率トレンド（新機能） */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-[#d4af37]" />
          <h2 className="font-bold text-lg">勝率トレンド（移動平均）</h2>
          <span className="text-xs text-slate-500 ml-1">— 直近N局の1着率・トップ率・4着率の推移</span>
        </div>
        <RollingWinRateChart stats={stats} color={playerColor} />
      </div>

      {/* 着順分布 */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-5 h-5 text-[#d4af37]" />
          <h2 className="font-bold text-lg">着順分布</h2>
        </div>
        <RankDistributionChart stats={stats} />
      </div>

      {/* 対局履歴 */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <List className="w-5 h-5 text-[#d4af37]" />
          <h2 className="font-bold text-lg">対局履歴</h2>
        </div>
        <GameHistoryTable
          games={data.games.filter((g) => g.players[playerName])}
          players={[playerName]}
          filterPlayer={playerName}
        />
      </div>
    </div>
  )
}
