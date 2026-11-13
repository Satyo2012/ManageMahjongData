export interface GameResult {
  rank: number
  points: number
  score: number
}

export interface Game {
  gameNo: number
  date?: string
  fileName: string
  players: Record<string, GameResult>
}

/** 1ファイル（1セッション）分の対局データ。localStorage / data.json の保存単位 */
export interface Book {
  id: string
  fileName: string
  date?: string
  games: Game[]
  players: string[]
  /** Google ドライブから同期したファイルの ID（自動同期で更新を検知するため） */
  driveFileId?: string
  /** 同期時点の Google ドライブ上の更新日時 (RFC 3339) */
  driveModifiedTime?: string
}

export interface PlayerStats {
  name: string
  games: number
  totalScore: number
  avgScore: number
  avgRank: number
  avgPoints: number
  firstRate: number
  secondRate: number
  thirdRate: number
  fourthRate: number
  /** 連帯率（1着 + 2着） */
  top2Rate: number
  flyingCount: number
  flyingRate: number
  firstCount: number
  secondCount: number
  thirdCount: number
  fourthCount: number
  scoreHistory: number[]
  cumulativeScoreHistory: number[]
  rankHistory: number[]
  /** scoreHistory と同じ並びの対局日 */
  dateHistory: (string | undefined)[]
}

/** ブック境界（時系列グラフ・セッション集計用） */
export interface BookBoundary {
  /** games 配列における 0-based の開始インデックス */
  startIndex: number
  gameCount: number
  date?: string
  fileName: string
}

/** 名前の表記ゆれ正規化マップ: rawName → canonicalName */
export type NameAliasMap = Record<string, string>

/** 集計済みデータ。games は古い順（日付不明は最古扱いで先頭） */
export interface MahjongData {
  games: Game[]
  /** 対局数の多い順 */
  players: string[]
  stats: Record<string, PlayerStats>
  bookBoundaries: BookBoundary[]
}

export interface HeadToHeadStats {
  playerA: string
  playerB: string
  totalGames: number
  playerAWins: number
  playerBWins: number
  playerAWinRate: number
  playerBWinRate: number
  playerAAvgRank: number
  playerBAvgRank: number
  playerAAvgScore: number
  playerBAvgScore: number
  playerAFirstCount: number
  playerBFirstCount: number
  games: Game[]
}
