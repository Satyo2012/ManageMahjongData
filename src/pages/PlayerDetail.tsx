import { useMemo } from 'react'
import { Activity, ArrowLeft, BarChart2, List, TrendingUp } from 'lucide-react'
import type { MahjongData } from '../types'
import { getDateExtent } from '../domain/filter'
import { formatPercent, formatSigned } from '../utils/format'
import { usePlayerColor } from '../theme/PlayerColorContext'
import { StatCard } from '../components/StatCard'
import { Section } from '../components/ui/Section'
import { PlayerName } from '../components/ui/PlayerName'
import { SignedValue } from '../components/ui/SignedValue'
import { ScoreLineChart } from '../components/charts/ScoreLineChart'
import { GameScoreBars } from '../components/charts/GameScoreBars'
import { RollingRateChart } from '../components/charts/RollingRateChart'
import { RankDistributionChart } from '../components/charts/RankDistributionChart'
import { GameHistoryTable } from '../components/games/GameHistoryTable'

interface Props {
  playerName: string
  data: MahjongData
  onBack: () => void
}

/** 平均着順の目安（4人打ちの期待値） */
const TARGET_AVG_RANK = 2.5
/** 4着率がこれを超えたら赤で警告 */
const FOURTH_RATE_WARNING = 30

export function PlayerDetail({ playerName, data, onBack }: Props) {
  const colorOf = usePlayerColor()
  const games = useMemo(() => data.games.filter((g) => g.players[playerName]), [data.games, playerName])
  const { minDate, maxDate } = useMemo(() => getDateExtent(games), [games])
  const stats = data.stats[playerName]

  const backButton = (
    <button type="button" onClick={onBack} className="btn-ghost">
      <ArrowLeft className="w-4 h-4" />
      戻る
    </button>
  )

  if (!stats || stats.games === 0) {
    return (
      <div className="space-y-6">
        {backButton}
        <p className="text-center text-slate-400 py-16">{playerName} のこの期間の対局はありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        {backButton}
        <div>
          <h1 className="text-2xl font-bold">
            <PlayerName name={playerName} />
          </h1>
          <p className="text-slate-400 text-sm">
            {stats.games}局の戦績{minDate && ` · ${minDate} 〜 ${maxDate}`}
          </p>
        </div>
        <div className="ml-auto text-right">
          <SignedValue value={stats.totalScore} className="text-3xl font-bold" />
          <span className="text-slate-400 text-sm ml-1">pt</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="対局数" value={stats.games} color="blue" />
        <StatCard
          label="平均着順"
          value={stats.avgRank.toFixed(3)}
          sub={`目安: ${TARGET_AVG_RANK.toFixed(3)}以下`}
          color={stats.avgRank < TARGET_AVG_RANK ? 'green' : 'red'}
        />
        <StatCard label="平均スコア" value={formatSigned(stats.avgScore, 2)} color={stats.avgScore > 0 ? 'green' : 'red'} />
        <StatCard
          label="連帯率"
          value={formatPercent(stats.top2Rate)}
          sub={`1着${formatPercent(stats.firstRate)} / 2着${formatPercent(stats.secondRate)}`}
          color="gold"
        />
        <StatCard label="1着回数" value={`${stats.firstCount}回`} sub={formatPercent(stats.firstRate)} color="gold" />
        <StatCard label="2着回数" value={`${stats.secondCount}回`} sub={formatPercent(stats.secondRate)} />
        <StatCard label="3着回数" value={`${stats.thirdCount}回`} sub={formatPercent(stats.thirdRate)} />
        <StatCard
          label="4着回数"
          value={`${stats.fourthCount}回`}
          sub={`${formatPercent(stats.fourthRate)} · 飛び${stats.flyingCount}回`}
          color={stats.fourthRate > FOURTH_RATE_WARNING ? 'red' : 'default'}
        />
      </div>

      <Section icon={TrendingUp} title="累積スコア推移">
        <ScoreLineChart players={[stats]} height={280} />
      </Section>

      <Section icon={BarChart2} title="各対局スコア">
        <GameScoreBars stats={stats} />
      </Section>

      <Section icon={Activity} title="勝率トレンド" note="直近N局の1着率・連帯率・4着率の推移（点線は25%）">
        <RollingRateChart stats={stats} color={colorOf(playerName)} />
      </Section>

      <Section icon={BarChart2} title="着順分布">
        <RankDistributionChart stats={stats} />
      </Section>

      <Section icon={List} title="対局履歴">
        <GameHistoryTable games={games} player={playerName} />
      </Section>
    </div>
  )
}
