import * as XLSX from 'xlsx'
import type { Game, MahjongData, PlayerStats } from '../types'

function extractDateFromFileName(name: string): string | undefined {
  const match = name.match(/(\d{8})/)
  if (!match) return undefined
  const d = match[1]
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
}

export function parseExcelFile(file: File): Promise<MahjongData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })

        // Use first sheet
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw: (string | number | null)[][] = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          defval: null,
        })

        // Row 0: player names at cols 3, 6, 9, 12 ... (every 3)
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

        // Data rows start at index 2
        const games: Game[] = []
        for (let i = 2; i < raw.length; i++) {
          const row = raw[i] as (string | number | null)[]
          const gameNo = row[0]
          if (gameNo === null || gameNo === undefined) continue

          // Skip rows marked with "-" (check columns)
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
              fileName: file.name,
              players: gamePlayers,
            })
          }
        }

        const stats = computeStats(players, games)
        const date = extractDateFromFileName(file.name)

        resolve({ games, players, stats, fileName: file.name, date })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

function computeStats(players: string[], games: Game[]): Record<string, PlayerStats> {
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

export function mergeData(datasets: MahjongData[]): MahjongData {
  if (datasets.length === 0) {
    return { games: [], players: [], stats: {}, fileName: '' }
  }

  const allPlayers = [...new Set(datasets.flatMap((d) => d.players))]
  const allGames = datasets.flatMap((d) => d.games)

  const stats = computeStats(allPlayers, allGames)

  return {
    games: allGames,
    players: allPlayers,
    stats,
    fileName: datasets.map((d) => d.fileName).join(', '),
  }
}
