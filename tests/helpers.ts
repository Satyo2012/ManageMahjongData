import type { Book, Game, GameResult } from '../src/types/index.ts'

/** [名前, 着順, スコア] の配列から対局を作る。素点はスコアから適当に作る */
export function makeGame(
  fileName: string,
  gameNo: number,
  date: string | undefined,
  results: [string, number, number][],
): Game {
  const players: Record<string, GameResult> = {}
  for (const [name, rank, score] of results) {
    players[name] = { rank, score, points: 30000 + score * 100 }
  }
  return { fileName, gameNo, date, players }
}

export function makeBook(fileName: string, date: string | undefined, games: Game[]): Book {
  const players = [...new Set(games.flatMap((g) => Object.keys(g.players)))]
  return { id: fileName, fileName, date, games, players }
}

/** 4人分の標準的な結果 */
export function fourPlayers(names: [string, string, string, string]): [string, number, number][] {
  return [
    [names[0], 1, 50],
    [names[1], 2, 10],
    [names[2], 3, -20],
    [names[3], 4, -40],
  ]
}
