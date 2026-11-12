import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import type { MahjongData } from '../../types'
import { useVisiblePlayers } from '../../hooks/useVisiblePlayers'
import { SegmentedControl } from '../ui/SegmentedControl'
import { PlayerToggle } from '../ui/PlayerToggle'
import { ScoreLineChart } from '../charts/ScoreLineChart'
import { ScoreTimelineChart } from '../charts/ScoreTimelineChart'

type ChartMode = 'count' | 'timeline'

const MODE_OPTIONS = [
  { value: 'count' as const, label: '局数ベース（人別）' },
  { value: 'timeline' as const, label: '時系列（全体）' },
]

/** 累積スコア推移。表示人数が多いと読めないため、初期表示は対局数上位のみ */
export function ScoreTrendCard({ data }: { data: MahjongData }) {
  const [mode, setMode] = useState<ChartMode>('count')
  const [showTrend, setShowTrend] = useState(false)
  const visibility = useVisiblePlayers(data.players)

  return (
    <section className="card p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="section-title">
          <TrendingUp className="w-5 h-5 text-mahjong-gold" />
          累積スコア推移
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          {mode === 'timeline' && (
            <button
              type="button"
              aria-pressed={showTrend}
              onClick={() => setShowTrend((v) => !v)}
              className={showTrend ? 'btn-primary text-xs py-1' : 'btn-ghost text-xs py-1'}
            >
              トレンド線
            </button>
          )}
          <SegmentedControl ariaLabel="グラフの横軸" options={MODE_OPTIONS} value={mode} onChange={setMode} />
        </div>
      </div>

      <PlayerToggle
        players={data.players}
        visible={visibility.visible}
        onToggle={visibility.toggle}
        onShowAll={visibility.showAll}
        onReset={visibility.reset}
        isDefault={visibility.isDefault}
      />

      {visibility.visible.length === 0 ? (
        <p className="text-center text-slate-400 text-sm py-16">表示するプレイヤーを選択してください</p>
      ) : mode === 'count' ? (
        <ScoreLineChart players={visibility.visible.map((name) => data.stats[name])} />
      ) : (
        <ScoreTimelineChart
          games={data.games}
          players={visibility.visible}
          bookBoundaries={data.bookBoundaries}
          showTrend={showTrend}
        />
      )}
    </section>
  )
}
