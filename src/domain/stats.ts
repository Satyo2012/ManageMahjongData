import type { Game, PlayerStats } from '../types/index.ts'
import { average, percent, round, sum } from './math.ts'

/** 4人打ちの1局に参加する人数 */
export const PLAYERS_PER_GAME = 4

/** 4人分の結果が揃っている対局か（入力途中の行などを除外するため） */
export function isCompleteGame(game: Game): boolean {
  return Object.keys(game.players).length === PLAYERS_PER_GAME
}

function emptyStats(name: string): PlayerStats {
  return {
    name,
    games: 0,
    totalScore: 0,
    avgScore: 0,
    avgRank: 0,
    avgPoints: 0,
    firstRate: 0,
    secondRate: 0,
    thirdRate: 0,
    fourthRate: 0,
    top2Rate: 0,
    flyingCount: 0,
    flyingRate: 0,
    firstCount: 0,
    secondCount: 0,
    thirdCount: 0,
    fourthCount: 0,
    scoreHistory: [],
    cumulativeScoreHistory: [],
    rankHistory: [],
    dateHistory: [],
  }
}

function cumulativeSums(values: number[]): number[] {
  const result: number[] = []
  let running = 0
  for (const v of values) {
    running += v
    result.push(round(running, 1))
  }
  return result
}

/** プレイヤー1人分の成績を games の並び順で集計する */
export function computePlayerStats(name: string, games: Game[]): PlayerStats {
  const played = games.filter((g) => g.players[name] !== undefined)
  const count = played.length
  if (count === 0) return emptyStats(name)

  const results = played.map((g) => g.players[name])
  const scores = results.map((r) => r.score)
  const ranks = results.map((r) => r.rank)
  const rankCount = (rank: number) => ranks.filter((r) => r === rank).length
  const firstCount = rankCount(1)
  const secondCount = rankCount(2)
  const thirdCount = rankCount(3)
  const fourthCount = rankCount(4)
  // 持ち点がマイナスになったら「飛び」
  const flyingCount = results.filter((r) => r.points < 0).length
  const totalScore = sum(scores)

  return {
    name,
    games: count,
    totalScore: round(totalScore, 1),
    avgScore: round(totalScore / count, 2),
    avgRank: round(average(ranks), 3),
    avgPoints: Math.round(average(results.map((r) => r.points))),
    firstCount,
    secondCount,
    thirdCount,
    fourthCount,
    firstRate: percent(firstCount, count),
    secondRate: percent(secondCount, count),
    thirdRate: percent(thirdCount, count),
    fourthRate: percent(fourthCount, count),
    top2Rate: percent(firstCount + secondCount, count),
    flyingCount,
    flyingRate: percent(flyingCount, count),
    scoreHistory: scores,
    cumulativeScoreHistory: cumulativeSums(scores),
    rankHistory: ranks,
    dateHistory: played.map((g) => g.date),
  }
}

export function computeStats(players: string[], games: Game[]): Record<string, PlayerStats> {
  return Object.fromEntries(players.map((name) => [name, computePlayerStats(name, games)]))
}

/** 対局に登場する全プレイヤーを「対局数の多い順 → 名前順」で返す */
export function listPlayersByGameCount(games: Game[]): string[] {
  const counts = new Map<string, number>()
  for (const game of games) {
    for (const name of Object.keys(game.players)) {
      counts.set(name, (counts.get(name) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort(([nameA, a], [nameB, b]) => b - a || nameA.localeCompare(nameB, 'ja'))
    .map(([name]) => name)
}

/** 合計スコア順のランキング */
export function rankByTotalScore(stats: Record<string, PlayerStats>): PlayerStats[] {
  return Object.values(stats)
    .filter((s) => s.games > 0)
    .sort((a, b) => b.totalScore - a.totalScore)
}
