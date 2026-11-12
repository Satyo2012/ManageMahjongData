import { useState } from 'react'
import { BarChart2, Grid3x3 } from 'lucide-react'
import type { MahjongData } from '../types'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { MonthlyTrend } from '../components/monthly/MonthlyTrend'
import { SessionHeatmap } from '../components/monthly/SessionHeatmap'

type ViewMode = 'monthly' | 'heatmap'

const MODE_OPTIONS = [
  { value: 'monthly' as const, label: <><BarChart2 className="w-4 h-4" />月次集計</> },
  { value: 'heatmap' as const, label: <><Grid3x3 className="w-4 h-4" />セッション着順</> },
]

export function MonthlyStats({ data }: { data: MahjongData }) {
  const [mode, setMode] = useState<ViewMode>('monthly')
  return (
    <div className="space-y-6">
      <SegmentedControl ariaLabel="表示切替" size="md" options={MODE_OPTIONS} value={mode} onChange={setMode} />
      {mode === 'monthly' ? <MonthlyTrend data={data} /> : <SessionHeatmap data={data} />}
    </div>
  )
}
