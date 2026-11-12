import type { Game } from '../types/index.ts'
import { compareDateAsc } from './date.ts'

export type SortDirection = 'asc' | 'desc'

/** 対局の時系列比較: 日付 → ファイル → 対局No（日付不明は最古扱い） */
export function compareGamesChronologically(a: Game, b: Game): number {
  return (
    compareDateAsc(a.date, b.date) ||
    a.fileName.localeCompare(b.fileName, 'ja') ||
    a.gameNo - b.gameNo
  )
}

/** 対局を時系列順に並べる。desc なら新しい順（日付不明は末尾） */
export function sortGamesByDate(games: Game[], direction: SortDirection): Game[] {
  const sorted = [...games].sort(compareGamesChronologically)
  return direction === 'asc' ? sorted : sorted.reverse()
}

/** 1局の結果を着順で並べる */
export function seatsByRank(game: Game): { name: string; rank: number; points: number; score: number }[] {
  return Object.entries(game.players)
    .map(([name, r]) => ({ name, ...r }))
    .sort((a, b) => a.rank - b.rank || b.score - a.score)
}
