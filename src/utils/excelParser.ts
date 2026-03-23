import * as XLSX from 'xlsx'
import type { Game, MahjongData, PlayerStats, HeadToHeadStats, NameAliasMap, BookBoundary } from '../types'
import { generateId } from './storage'

export function extractDateFromFileName(name: string): string | undefined {
  const match = name.match(/(\d{8})/)
  if (!match) return undefined
  const d = match[1]
  // 簡易バリデーション: 月・日が妥当な範囲か
  const month = parseInt(d.slice(4, 6), 10)
  const day = parseInt(d.slice(6, 8), 10)
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
}

export function parseExcelFile(file: File): Promise<MahjongData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })

        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw: (string | number | null)[][] = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          defval: null,
        })

        const headerRow = raw[0] as (string | null)[]
        const players: string[] = []
        for (let col = 3; col < headerRow.length - 1; col += 3) {
          const name = headerRow[col]
          if (name && typeof name === 'string' && name.trim()) {
            players.push(name.trim())
          } else {
            break
          }
        }

        const date = extractDateFromFileName(file.name)
        const games: Game[] = []

        for (let i = 2; i < raw.length; i++) {
          const row = raw[i] as (string | number | null)[]
          const gameNo = row[0]
          if (gameNo === null || gameNo === undefined) continue

          const check1 = row[1]
          if (check1 === '-' || check1 === null) continue

          const gamePlayers: Record<string, { rank: number; points: number; score: number }> = {}
          let hasData = false

          players.forEach((playerName, idx) => {
            const baseCol = 3 + idx * 3
            const rank = row[baseCol]
            const points = row[baseCol + 1]
            const score = row[baseCol + 2]

            if (rank !== null && points !== null && score !== null) {
              gamePlayers[playerName] = {
                rank: Number(rank),
                points: Number(points),
                score: Number(score),
              }
              hasData = true
            }
          })

          if (hasData) {
            games.push({
              gameNo: Number(gameNo),
              date,          // ← ファイル名から抽出した日付をゲームにも付与
              fileName: file.name,
              players: gamePlayers,
            })
          }
        }

        const stats = computeStats(players, games)

        resolve({
          id: generateId(),
          games,
          players,
          stats,
          fileName: file.name,
          date,
          bookBoundaries: [],
        })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

export function computeStats(players: string[], games: Game[]): Record<string, PlayerStats> {
  const stats: Record<string, PlayerStats> = {}

  for (const name of players) {
    const playerGames = games.filter((g) => g.players[name] !== undefined)

    const scores = playerGames.map((g) => g.players[name].score)
    const ranks = playerGames.map((g) => g.players[name].rank)
    const points = playerGames.map((g) => g.players[name].points)

    const gameCount = playerGames.length
    if (gameCount === 0) {
      stats[name] = {
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
        topRate: 0,
        flyingCount: 0,
        flyingRate: 0,
        firstCount: 0,
        secondCount: 0,
        thirdCount: 0,
        fourthCount: 0,
        scoreHistory: [],
        cumulativeScoreHistory: [],
        rankHistory: [],
        gameIndices: [],
      }
      continue
    }

    const firstCount = ranks.filter((r) => r === 1).length
    const secondCount = ranks.filter((r) => r === 2).length
    const thirdCount = ranks.filter((r) => r === 3).length
    const fourthCount = ranks.filter((r) => r === 4).length
    const flyingCount = points.filter((p) => p < 0).length

    const totalScore = scores.reduce((a, b) => a + b, 0)
    const cumulative: number[] = []
    let cum = 0
    for (const s of scores) {
      cum += s
      cumulative.push(Math.round(cum * 10) / 10)
    }

    stats[name] = {
      name,
      games: gameCount,
      totalScore: Math.round(totalScore * 10) / 10,
      avgScore: Math.round((totalScore / gameCount) * 100) / 100,
      avgRank: Math.round((ranks.reduce((a, b) => a + b, 0) / gameCount) * 1000) / 1000,
      avgPoints: Math.round(points.reduce((a, b) => a + b, 0) / gameCount),
      firstCount,
      secondCount,
      thirdCount,
      fourthCount,
      firstRate: Math.round((firstCount / gameCount) * 1000) / 10,
      secondRate: Math.round((secondCount / gameCount) * 1000) / 10,
      thirdRate: Math.round((thirdCount / gameCount) * 1000) / 10,
      fourthRate: Math.round((fourthCount / gameCount) * 1000) / 10,
      topRate: Math.round(((firstCount + secondCount) / gameCount) * 1000) / 10,
      flyingCount,
      flyingRate: Math.round((flyingCount / gameCount) * 1000) / 10,
      scoreHistory: scores,
      cumulativeScoreHistory: cumulative,
      rankHistory: ranks,
      gameIndices: playerGames.map((g) => g.gameNo),
    }
  }

  return stats
}

/** 名前エイリアスをゲームリストに適用する */
function applyNameAliases(games: Game[], aliases: NameAliasMap): Game[] {
  if (Object.keys(aliases).length === 0) return games
  return games.map((game) => ({
    ...game,
    players: Object.fromEntries(
      Object.entries(game.players).map(([name, result]) => [aliases[name] ?? name, result]),
    ),
  }))
}

export function mergeData(datasets: MahjongData[], nameAliases: NameAliasMap = {}): MahjongData {
  if (datasets.length === 0) {
    return { id: 'merged', games: [], players: [], stats: {}, fileName: '', bookBoundaries: [] }
  }

  // 日付昇順でソート（日付なしは末尾）
  const sorted = [...datasets].sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    return a.date.localeCompare(b.date)
  })

  // ブック境界を計算
  const bookBoundaries: BookBoundary[] = []
  let offset = 0
  for (const dataset of sorted) {
    bookBoundaries.push({
      startIndex: offset,
      date: dataset.date ?? '日付不明',
      fileName: dataset.fileName,
    })
    offset += dataset.games.length
  }

  const rawGames = sorted.flatMap((d) => d.games)
  const games = applyNameAliases(rawGames, nameAliases)

  const allPlayers = [...new Set(games.flatMap((g) => Object.keys(g.players)))]
  const stats = computeStats(allPlayers, games)

  return {
    id: 'merged',
    games,
    players: allPlayers,
    stats,
    fileName: sorted.map((d) => d.fileName).join(', '),
    bookBoundaries,
  }
}

export function computeHeadToHead(
  playerA: string,
  playerB: string,
  games: Game[],
): HeadToHeadStats {
  const h2hGames = games.filter((g) => g.players[playerA] && g.players[playerB])
  const totalGames = h2hGames.length

  let playerAWins = 0
  let playerBWins = 0
  let playerAFirstCount = 0
  let playerBFirstCount = 0

  for (const game of h2hGames) {
    const rankA = game.players[playerA].rank
    const rankB = game.players[playerB].rank
    if (rankA < rankB) playerAWins++
    else if (rankB < rankA) playerBWins++
    if (rankA === 1) playerAFirstCount++
    if (rankB === 1) playerBFirstCount++
  }

  const avgRank = (player: string) =>
    totalGames > 0
      ? Math.round((h2hGames.reduce((a, g) => a + g.players[player].rank, 0) / totalGames) * 100) / 100
      : 0

  const avgScore = (player: string) =>
    totalGames > 0
      ? Math.round((h2hGames.reduce((a, g) => a + g.players[player].score, 0) / totalGames) * 100) / 100
      : 0

  return {
    playerA,
    playerB,
    totalGames,
    playerAWins,
    playerBWins,
    playerAWinRate: totalGames > 0 ? Math.round((playerAWins / totalGames) * 1000) / 10 : 0,
    playerBWinRate: totalGames > 0 ? Math.round((playerBWins / totalGames) * 1000) / 10 : 0,
    playerAAvgRank: avgRank(playerA),
    playerBAvgRank: avgRank(playerB),
    playerAAvgScore: avgScore(playerA),
    playerBAvgScore: avgScore(playerB),
    playerAFirstCount,
    playerBFirstCount,
    games: h2hGames,
  }
}
