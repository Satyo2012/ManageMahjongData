/**
 * 暗い背景で見分けやすい色。対局数の多いプレイヤーから順に割り当てるので、
 * 主要メンバーほど識別しやすい色になる。
 */
export const PLAYER_PALETTE = [
  '#d4af37', '#60a5fa', '#4ade80', '#f87171', '#c084fc',
  '#fb923c', '#22d3ee', '#f472b6', '#a3e635', '#facc15',
  '#818cf8', '#2dd4bf', '#fda4af', '#94a3b8', '#e879f9',
  '#fdba74', '#38bdf8', '#86efac', '#d6d3d1', '#fca5a5',
] as const

export const FALLBACK_PLAYER_COLOR = '#94a3b8'

export type PlayerColorMap = Record<string, string>

/** players の並び順で色を割り当てる（ページやフィルターが変わっても同じ人は同じ色） */
export function buildPlayerColorMap(players: string[]): PlayerColorMap {
  return Object.fromEntries(players.map((name, i) => [name, PLAYER_PALETTE[i % PLAYER_PALETTE.length]]))
}
