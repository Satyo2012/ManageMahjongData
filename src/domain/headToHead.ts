import type { Game, HeadToHeadStats } from '../types/index.ts'
import { average, percent, round } from './math.ts'

export function computeHeadToHead(playerA: string, playerB: string, games: Game[]): HeadToHeadStats {
  const shared = games.filter((g) => g.players[playerA] && g.players[playerB])
  const totalGames = shared.length

  let playerAWins = 0
  let playerBWins = 0
  let playerAFirstCount = 0
  let playerBFirstCount = 0
  for (const game of shared) {
    const rankA = game.players[playerA].rank
    const rankB = game.players[playerB].rank
    if (rankA < rankB) playerAWins++
    else if (rankB < rankA) playerBWins++
    if (rankA === 1) playerAFirstCount++
    if (rankB === 1) playerBFirstCount++
  }

  const avgOf = (player: string, key: 'rank' | 'score') =>
    round(average(shared.map((g) => g.players[player][key])), 2)

  return {
    playerA,
    playerB,
    totalGames,
    playerAWins,
    playerBWins,
    playerAWinRate: percent(playerAWins, totalGames),
    playerBWinRate: percent(playerBWins, totalGames),
    playerAAvgRank: avgOf(playerA, 'rank'),
    playerBAvgRank: avgOf(playerB, 'rank'),
    playerAAvgScore: avgOf(playerA, 'score'),
    playerBAvgScore: avgOf(playerB, 'score'),
    playerAFirstCount,
    playerBFirstCount,
    games: shared,
  }
}

/** 同卓時の累積スコア推移（古い順） */
export function headToHeadCumulative(h2h: HeadToHeadStats): { index: number; date?: string; a: number; b: number }[] {
  let cumA = 0
  let cumB = 0
  return h2h.games.map((g, i) => {
    cumA += g.players[h2h.playerA].score
    cumB += g.players[h2h.playerB].score
    return { index: i + 1, date: g.date, a: round(cumA, 1), b: round(cumB, 1) }
  })
}

/** 比較結果: 'a' / 'b' / 'tie'（同値はどちらも強調しない） */
export function compareBetter(a: number, b: number, higherIsBetter: boolean): 'a' | 'b' | 'tie' {
  if (a === b) return 'tie'
  return (a > b) === higherIsBetter ? 'a' : 'b'
}
