import type { Book, Game, GameResult } from '../types/index.ts'
import { extractDateFromFileName } from './date.ts'
import { PLAYERS_PER_GAME } from './stats.ts'

export type Cell = string | number | null
export type Row = Cell[]

/** プレイヤー1人あたりの列数（順位・素点・スコア） */
const COLUMNS_PER_PLAYER = 3
/** サブヘッダー（2行目）で「順位」を探す列の範囲。テンプレートの版によって 2 or 3 列目から始まる */
const PLAYER_COL_SEARCH = { from: 2, to: 4, fallback: 3 }
const RANK_HEADER = '順位'
const FIRST_DATA_ROW = 2

export class SheetParseError extends Error {}

function isRankHeader(cell: Cell | undefined): boolean {
  return typeof cell === 'string' && cell.includes(RANK_HEADER)
}

function findPlayerColumnOffset(subHeader: Row): number {
  for (let col = PLAYER_COL_SEARCH.from; col <= PLAYER_COL_SEARCH.to; col++) {
    if (isRankHeader(subHeader[col])) return col
  }
  return PLAYER_COL_SEARCH.fallback
}

function readPlayerNames(header: Row, subHeader: Row, offset: number): string[] {
  const players: string[] = []
  for (let col = offset; col < header.length; col += COLUMNS_PER_PLAYER) {
    const name = header[col]
    if (typeof name !== 'string' || !name.trim()) break
    // サブヘッダーに「順位」が無い列は「持ち点合計」などの集計列
    if (!isRankHeader(subHeader[col])) break
    players.push(name.trim())
  }
  return players
}

function toFiniteNumber(cell: Cell | undefined): number | undefined {
  if (cell === null || cell === undefined || cell === '') return undefined
  const n = Number(cell)
  return Number.isFinite(n) ? n : undefined
}

function readGameRow(row: Row, players: string[], offset: number): Record<string, GameResult> {
  const results: Record<string, GameResult> = {}
  players.forEach((name, idx) => {
    const base = offset + idx * COLUMNS_PER_PLAYER
    const rank = toFiniteNumber(row[base])
    const points = toFiniteNumber(row[base + 1])
    const score = toFiniteNumber(row[base + 2])
    if (rank !== undefined && points !== undefined && score !== undefined) {
      results[name] = { rank, points, score }
    }
  })
  return results
}

/**
 * 麻雀集計表シートの2次元配列から対局を読み取る。
 * 4人分揃っていない行（入力途中など）は除外し、対局が1つも無ければエラーにする。
 */
export function parseSheetRows(rows: Row[], fileName: string): Omit<Book, 'id'> {
  const header = rows[0] ?? []
  const subHeader = rows[1] ?? []
  const offset = findPlayerColumnOffset(subHeader)
  const players = readPlayerNames(header, subHeader, offset)
  const date = extractDateFromFileName(fileName)

  const games: Game[] = []
  for (const row of rows.slice(FIRST_DATA_ROW)) {
    const gameNo = row[0]
    // 対局No が数値でない行・'-' 区切りの小計行はスキップ
    if (typeof gameNo !== 'number' || row[1] === '-') continue
    const results = readGameRow(row, players, offset)
    if (Object.keys(results).length !== PLAYERS_PER_GAME) continue
    games.push({ gameNo, date, fileName, players: results })
  }

  if (games.length === 0) {
    throw new SheetParseError('対局データが見つかりませんでした（4人分の結果が揃った行がありません）')
  }
  // テンプレートに名前だけある未参加プレイヤーを除外
  const activePlayers = players.filter((p) => games.some((g) => g.players[p]))
  return { fileName, date, games, players: activePlayers }
}
