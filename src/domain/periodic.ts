import type { Game, MahjongData } from '../types/index.ts'
import { average, percent, round, sum } from './math.ts'

export interface PeriodPlayerStat {
  games: number
  totalScore: number
  avgScore: number
  avgRank: number
  firstRate: number
}

export interface MonthlyRow {
  /** YYYY-MM */
  month: string
  players: Record<string, PeriodPlayerStat>
}

export interface SessionSummary {
  date?: string
  fileName: string
  totalGames: number
  players: Record<string, PeriodPlayerStat>
}

function summarize(games: Game[]): Record<string, PeriodPlayerStat> {
  const byPlayer = new Map<string, { scores: number[]; ranks: number[] }>()
  for (const game of games) {
    for (const [name, r] of Object.entries(game.players)) {
      const entry = byPlayer.get(name) ?? { scores: [], ranks: [] }
      entry.scores.push(r.score)
      entry.ranks.push(r.rank)
      byPlayer.set(name, entry)
    }
  }
  const result: Record<string, PeriodPlayerStat> = {}
  for (const [name, { scores, ranks }] of byPlayer) {
    result[name] = {
      games: scores.length,
      totalScore: round(sum(scores), 1),
      avgScore: round(average(scores), 2),
      avgRank: round(average(ranks), 2),
      firstRate: percent(ranks.filter((r) => r === 1).length, ranks.length),
    }
  }
  return result
}

/**
 * 月次集計（古い順）。日付不明の対局は月が特定できないため除外する。
 * 以前は「不明」という月が文字列比較で最新月の後ろに並んでいた。
 */
export function computeMonthlyRows(games: Game[]): MonthlyRow[] {
  const byMonth = new Map<string, Game[]>()
  for (const game of games) {
    if (!game.date) continue
    const month = game.date.slice(0, 7)
    byMonth.set(month, [...(byMonth.get(month) ?? []), game])
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, monthGames]) => ({ month, players: summarize(monthGames) }))
}

/** セッション（ブック）単位の集計（古い順） */
export function computeSessionSummaries(data: MahjongData): SessionSummary[] {
  return data.bookBoundaries.map((b) => ({
    date: b.date,
    fileName: b.fileName,
    totalGames: b.gameCount,
    players: summarize(data.games.slice(b.startIndex, b.startIndex + b.gameCount)),
  }))
}
