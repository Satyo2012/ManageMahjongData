import { CalendarRange, X } from 'lucide-react'

export interface DateRange {
  start: string
  end: string
}

interface Props {
  range: DateRange
  onChange: (r: DateRange) => void
  minDate?: string
  maxDate?: string
}

export function DateRangeFilter({ range, onChange, minDate, maxDate }: Props) {
  const hasFilter = range.start || range.end

  const presets = [
    { label: '直近1ヶ月', months: 1 },
    { label: '直近3ヶ月', months: 3 },
    { label: '直近6ヶ月', months: 6 },
    { label: '直近1年', months: 12 },
  ]

  const applyPreset = (months: number) => {
    const end = maxDate ?? new Date().toISOString().slice(0, 10)
    const d = new Date(end)
    d.setMonth(d.getMonth() - months)
    onChange({ start: d.toISOString().slice(0, 10), end })
  }

  return (
    <div className="card px-4 py-3 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-slate-400 text-sm">
          <CalendarRange className="w-4 h-4 text-[#d4af37]" />
          <span className="font-medium text-slate-300">期間フィルター</span>
        </div>

        <div className="flex items-center gap-2 ml-2 flex-wrap">
          <input
            type="date"
            value={range.start}
            min={minDate}
            max={range.end || maxDate}
            onChange={(e) => onChange({ ...range, start: e.target.value })}
            className="bg-[#162535] border border-[#2d4a6a] rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-[#d4af37]/60 [color-scheme:dark]"
          />
          <span className="text-slate-500 text-sm">〜</span>
          <input
            type="date"
            value={range.end}
            min={range.start || minDate}
            max={maxDate}
            onChange={(e) => onChange({ ...range, end: e.target.value })}
            className="bg-[#162535] border border-[#2d4a6a] rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-[#d4af37]/60 [color-scheme:dark]"
          />
        </div>

        {/* プリセットボタン */}
        <div className="flex gap-1 flex-wrap">
          {presets.map((p) => (
            <button
              key={p.months}
              onClick={() => applyPreset(p.months)}
              className="px-2 py-0.5 rounded text-xs card hover:border-[#d4af37]/50 text-slate-400 hover:text-white transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        {hasFilter && (
          <button
            onClick={() => onChange({ start: '', end: '' })}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-red-400 hover:text-red-300 border border-red-900/40 hover:border-red-700/60 transition-colors"
          >
            <X className="w-3 h-3" />
            クリア
          </button>
        )}
      </div>

      {hasFilter && (
        <p className="text-xs text-[#d4af37]">
          ⚡ フィルター適用中：全グラフ・集計が選択期間のデータのみで表示されます
        </p>
      )}
    </div>
  )
}
