import clsx from 'clsx'
import { CalendarRange } from 'lucide-react'
import { subtractMonths, todayIso } from '../domain/date'
import { ALL_TIME, isRangeActive, type DateRange } from '../domain/filter'

interface Props {
  range: DateRange
  onChange: (range: DateRange) => void
  minDate?: string
  maxDate?: string
  /** 期間内の対局数 */
  filteredCount: number
  /** 期間指定時に除外される日付不明の対局数 */
  undatedCount: number
}

interface Preset {
  label: string
  range: (latest: string) => DateRange
}

const PRESETS: Preset[] = [
  { label: '全期間', range: () => ALL_TIME },
  { label: '直近1ヶ月', range: (latest) => ({ start: subtractMonths(latest, 1), end: latest }) },
  { label: '直近3ヶ月', range: (latest) => ({ start: subtractMonths(latest, 3), end: latest }) },
  { label: '直近6ヶ月', range: (latest) => ({ start: subtractMonths(latest, 6), end: latest }) },
  { label: '直近1年', range: (latest) => ({ start: subtractMonths(latest, 12), end: latest }) },
  { label: '今年', range: (latest) => ({ start: `${latest.slice(0, 4)}-01-01`, end: latest }) },
]

const sameRange = (a: DateRange, b: DateRange) => a.start === b.start && a.end === b.end

/** 全ページ共通の期間フィルター。「直近」は最新の対局日を基準にする */
export function DateRangeFilter({ range, onChange, minDate, maxDate, filteredCount, undatedCount }: Props) {
  const latest = maxDate ?? todayIso()
  const active = isRangeActive(range)

  return (
    <div className="card px-4 py-3 space-y-2">
      <div className="flex items-center gap-x-3 gap-y-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm">
          <CalendarRange className="w-4 h-4 text-mahjong-gold" />
          <span className="font-medium text-slate-200">期間</span>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {PRESETS.map((preset) => {
            const presetRange = preset.range(latest)
            const selected = sameRange(range, presetRange)
            return (
              <button
                key={preset.label}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(presetRange)}
                className={clsx(
                  'px-2.5 py-1 rounded-md text-xs border transition-colors',
                  selected
                    ? 'bg-mahjong-gold text-black font-bold border-mahjong-gold'
                    : 'border-mahjong-border text-slate-300 hover:text-white hover:border-mahjong-gold/50',
                )}
              >
                {preset.label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            aria-label="開始日"
            value={range.start}
            min={minDate}
            max={range.end || maxDate}
            onChange={(e) => onChange({ ...range, start: e.target.value })}
            className="input"
          />
          <span className="text-slate-400 text-sm">〜</span>
          <input
            type="date"
            aria-label="終了日"
            value={range.end}
            min={range.start || minDate}
            max={maxDate}
            onChange={(e) => onChange({ ...range, end: e.target.value })}
            className="input"
          />
        </div>
      </div>

      {active && (
        <p className="text-xs text-mahjong-gold">
          {range.start || '最初'} 〜 {range.end || '最新'} の {filteredCount}局で集計中
          {undatedCount > 0 && <span className="text-slate-400">（日付不明の {undatedCount}局は期間指定時に除外）</span>}
        </p>
      )}
    </div>
  )
}
