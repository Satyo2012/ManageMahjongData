import type { MahjongData } from '../types'

function esc(v: unknown): string {
  const s = String(v ?? '')
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s
}

function dl(csv: string, name: string) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: name,
  })
  a.click()
  URL.revokeObjectURL(a.href)
}

/** 全対局データをCSVエクスポート */
export function exportGamesCsv(data: MahjongData) {
  const ps = data.players.filter((p) => data.stats[p]?.games > 0)
  const headers = [
    '対局No', '日付', 'ファイル',
    ...ps.flatMap((p) => [`${p}_着順`, `${p}_PT`, `${p}_スコア`]),
  ]
  const rows: unknown[][] = data.games.map((g) => {
    const base: unknown[] = [g.gameNo, g.date ?? '', g.fileName]
    for (const p of ps) {
      const r = g.players[p]
      if (r) { base.push(r.rank, r.points, r.score) } else { base.push('', '', '') }
    }
    return base
  })
  dl([headers, ...rows].map((r) => r.map(esc).join(',')).join('\n'), 'mahjong_games.csv')
}

/** プレイヤー別成績をCSVエクスポート */
export function exportStatsCsv(data: MahjongData) {
  const ps = data.players
    .filter((p) => data.stats[p]?.games > 0)
    .sort((a, b) => data.stats[b].totalScore - data.stats[a].totalScore)
  const headers = [
    'プレイヤー', '対局数', '合計PT', '平均PT', '平均着順',
    '1着率', '2着率', '3着率', '4着率', '連帯率', '飛び率',
  ]
  const rows: unknown[][] = ps.map((p) => {
    const s = data.stats[p]
    return [
      s.name, s.games, s.totalScore, s.avgScore, s.avgRank,
      `${s.firstRate}%`, `${s.secondRate}%`, `${s.thirdRate}%`,
      `${s.fourthRate}%`, `${s.topRate}%`, `${s.flyingRate}%`,
    ]
  })
  dl([headers, ...rows].map((r) => r.map(esc).join(',')).join('\n'), 'mahjong_stats.csv')
}
