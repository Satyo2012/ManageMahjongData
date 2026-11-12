import { useMemo } from 'react'
import { Grid3x3 } from 'lucide-react'
import type { MahjongData } from '../../types'
import { computeSessionSummaries } from '../../domain/periodic'
import { formatDate } from '../../domain/date'
import { formatSigned, shortFileName } from '../../utils/format'
import { Section } from '../ui/Section'
import { PlayerName } from '../ui/PlayerName'

/** データ内の最小〜最大着順を [0,1] に正規化して緑（良）→赤（悪）の色を返す */
function rankToColor(avgRank: number, min: number, max: number) {
  const range = max - min
  const t = range > 0.001 ? Math.max(0, Math.min(1, (avgRank - min) / range)) : 0.5
  const hue = Math.round(120 * (1 - t))
  return { text: `hsl(${hue}, 85%, 70%)`, bg: `hsla(${hue}, 85%, 45%, 0.25)`, border: `hsla(${hue}, 85%, 55%, 0.6)` }
}

/** 列見出し: 年が変わる列だけ年を表示 */
function headerLabel(date: string | undefined, prevDate: string | undefined) {
  if (!date) return { year: '', day: formatDate(undefined) }
  const showYear = !prevDate || prevDate.slice(0, 4) !== date.slice(0, 4)
  return { year: showYear ? date.slice(0, 4) : '', day: `${date.slice(5, 7)}/${date.slice(8, 10)}` }
}

/** セッション（ブック）ごとの平均着順。新しいセッションが左 */
export function SessionHeatmap({ data }: { data: MahjongData }) {
  const sessions = useMemo(() => computeSessionSummaries(data).reverse(), [data])
  const range = useMemo(() => {
    const all = sessions.flatMap((s) => Object.values(s.players).map((p) => p.avgRank))
    return all.length > 0 ? { min: Math.min(...all), max: Math.max(...all) } : { min: 1, max: 4 }
  }, [sessions])

  return (
    <Section icon={Grid3x3} title="セッション別着順ヒートマップ" note="各セッション（ブック）での平均着順。新しいセッションが左">
      <div className="flex items-center gap-3 text-xs text-slate-300 mb-3 flex-wrap">
        <span>良 ({range.min.toFixed(1)})</span>
        <span className="w-20 h-3 rounded-sm inline-block" style={{ background: 'linear-gradient(to right, hsl(120,85%,55%), hsl(60,85%,55%), hsl(0,85%,55%))' }} />
        <span>悪 ({range.max.toFixed(1)})</span>
        <span className="inline-flex items-center gap-1 ml-2">
          <span className="w-3 h-3 rounded-sm inline-block bg-mahjong-panel border border-mahjong-border" />
          不参加
        </span>
      </div>

      {sessions.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-8">データがありません</p>
      ) : (
        <div className="overflow-x-auto pb-2">
          <table className="text-xs border-separate border-spacing-0.5">
            <thead>
              <tr>
                <th className="text-left pr-3 text-slate-300 font-normal sticky left-0 bg-mahjong-card z-10 min-w-[100px]">プレイヤー</th>
                {sessions.map((s, i) => {
                  const { year, day } = headerLabel(s.date, sessions[i - 1]?.date)
                  return (
                    <th key={s.fileName} className="font-normal text-slate-300 min-w-[48px] align-bottom" title={s.fileName}>
                      <span className="block text-[10px] text-mahjong-gold h-3">{year}</span>
                      <span className={s.date ? 'tabular-nums' : 'text-amber-400 text-[10px]'}>{s.date ? day : shortFileName(s.fileName).slice(0, 6)}</span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {data.players.map((player) => (
                <tr key={player}>
                  <td className="pr-3 text-slate-200 font-medium sticky left-0 bg-mahjong-card z-10 whitespace-nowrap">
                    <PlayerName name={player} />
                  </td>
                  {sessions.map((s) => {
                    const ps = s.players[player]
                    if (!ps) return <td key={s.fileName}><div className="w-12 h-9 rounded bg-mahjong-panel border border-mahjong-border/40" /></td>
                    const color = rankToColor(ps.avgRank, range.min, range.max)
                    const score = formatSigned(ps.totalScore)
                    return (
                      <td key={s.fileName} title={`${player} @ ${formatDate(s.date)}\n平均着順: ${ps.avgRank.toFixed(2)}\n合計スコア: ${score}\n対局数: ${ps.games}`}>
                        <div className="w-12 h-9 rounded flex flex-col items-center justify-center leading-tight" style={{ backgroundColor: color.bg, border: `1px solid ${color.border}`, color: color.text }}>
                          <span className="font-bold">{ps.avgRank.toFixed(1)}</span>
                          <span className="text-[10px] opacity-90">{score}</span>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  )
}
