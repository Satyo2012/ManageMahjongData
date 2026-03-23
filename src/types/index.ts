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
  topRate: number
  flyingCount: number
  flyingRate: number
  firstCount: number
  secondCount: number
  thirdCount: number
  fourthCount: number
  scoreHistory: number[]
  cumulativeScoreHistory: number[]
  rankHistory: number[]
  gameIndices: number[]
}

export interface MahjongData {
  id: string
  games: Game[]
  players: string[]
  stats: Record<string, PlayerStats>
  fileName: string
  date?: string
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
