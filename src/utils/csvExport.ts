import type { MahjongData } from '../types'
import { rankByTotalScore } from '../domain/stats'
import { downloadBlob } from './download'

function escapeCsv(value: unknown): string {
  const s = String(value ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function downloadCsv(rows: unknown[][], fileName: string): void {
  const csv = rows.map((r) => r.map(escapeCsv).join(',')).join('\n')
  // Excel で文字化けしないよう BOM を付ける
  downloadBlob(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }), fileName)
}

/** 全対局データをCSVエクスポート（古い順） */
export function exportGamesCsv(data: MahjongData): void {
  const players = data.players
  const headers = ['日付', '対局No', 'ファイル', ...players.flatMap((p) => [`${p}_着順`, `${p}_素点`, `${p}_スコア`])]
  const rows = data.games.map((g): (string | number)[] => [
    g.date ?? '',
    g.gameNo,
    g.fileName,
    ...players.flatMap((p): (string | number)[] => {
      const r = g.players[p]
      return r ? [r.rank, r.points, r.score] : ['', '', '']
    }),
  ])
  downloadCsv([headers, ...rows], 'mahjong_games.csv')
}

/** プレイヤー別成績をCSVエクスポート（合計スコア順） */
export function exportStatsCsv(data: MahjongData): void {
  const headers = ['プレイヤー', '対局数', '合計PT', '平均PT', '平均着順', '1着率', '2着率', '3着率', '4着率', '連帯率', '飛び率']
  const rows = rankByTotalScore(data.stats).map((s) => [
    s.name, s.games, s.totalScore, s.avgScore, s.avgRank,
    `${s.firstRate}%`, `${s.secondRate}%`, `${s.thirdRate}%`, `${s.fourthRate}%`, `${s.top2Rate}%`, `${s.flyingRate}%`,
  ])
  downloadCsv([headers, ...rows], 'mahjong_stats.csv')
}
