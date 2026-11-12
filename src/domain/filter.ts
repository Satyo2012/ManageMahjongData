import type { Game } from '../types/index.ts'

export interface DateRange {
  start: string
  end: string
}

export const ALL_TIME: DateRange = { start: '', end: '' }

export function isRangeActive(range: DateRange): boolean {
  return range.start !== '' || range.end !== ''
}

/**
 * 期間で対局を絞り込む（両端を含む）。
 * 期間指定時は日付不明の対局を除外する。以前は日付不明を常に含めていたため、
 * 「直近1ヶ月」に過去の対局（日付不明ブック）が混入していた。
 */
export function filterGamesByDateRange(games: Game[], range: DateRange): Game[] {
  if (!isRangeActive(range)) return games
  return games.filter((g) => {
    if (!g.date) return false
    if (range.start && g.date < range.start) return false
    if (range.end && g.date > range.end) return false
    return true
  })
}

export function countUndatedGames(games: Game[]): number {
  return games.filter((g) => !g.date).length
}

/** 日付付き対局の最初と最後の日付 */
export function getDateExtent(games: Game[]): { minDate?: string; maxDate?: string } {
  let minDate: string | undefined
  let maxDate: string | undefined
  for (const { date } of games) {
    if (!date) continue
    if (!minDate || date < minDate) minDate = date
    if (!maxDate || date > maxDate) maxDate = date
  }
  return { minDate, maxDate }
}
