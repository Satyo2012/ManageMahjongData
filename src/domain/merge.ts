import type { Book, BookBoundary, Game, MahjongData, NameAliasMap } from '../types/index.ts'
import { sortBooksByDate } from './books.ts'
import { computeStats, isCompleteGame, listPlayersByGameCount } from './stats.ts'

/** 名前エイリアス（表記ゆれ）をゲームリストに適用する */
export function applyNameAliases(games: Game[], aliases: NameAliasMap): Game[] {
  if (Object.keys(aliases).length === 0) return games
  return games.map((game) => ({
    ...game,
    players: Object.fromEntries(
      Object.entries(game.players).map(([name, result]) => [aliases[name] ?? name, result]),
    ),
  }))
}

/** 連続する同一ファイルの対局をひとまとまりとしてブック境界を求める */
export function computeBookBoundaries(games: Game[]): BookBoundary[] {
  const boundaries: BookBoundary[] = []
  games.forEach((game, index) => {
    const last = boundaries[boundaries.length - 1]
    if (last && last.fileName === game.fileName) {
      last.gameCount++
      return
    }
    boundaries.push({ startIndex: index, gameCount: 1, date: game.date, fileName: game.fileName })
  })
  return boundaries
}

/** 時系列順に並んだ対局リストから集計データを組み立てる */
export function buildMahjongData(games: Game[]): MahjongData {
  const players = listPlayersByGameCount(games)
  return {
    games,
    players,
    stats: computeStats(players, games),
    bookBoundaries: computeBookBoundaries(games),
  }
}

/**
 * 全ブックを日付順に結合して集計する。
 * - ブックの日付を各対局の日付として採用（ブック側で日付を修正できるようにするため）
 * - 4人分揃っていない対局（入力途中の行など）は除外
 */
export function mergeBooks(books: Book[], aliases: NameAliasMap = {}): MahjongData {
  const games = sortBooksByDate(books).flatMap((book) =>
    book.games.filter(isCompleteGame).map((g) => ({ ...g, date: book.date ?? g.date })),
  )
  return buildMahjongData(applyNameAliases(games, aliases))
}
