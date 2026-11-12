import { percent } from './math.ts'

export interface RollingPoint {
  /** プレイヤーにとって何局目か (1-based) */
  gameNumber: number
  date?: string
  firstRate: number
  top2Rate: number
  fourthRate: number
}

/** 直近 windowSize 局の移動平均（1着率・連帯率・4着率） */
export function computeRollingRates(
  ranks: number[],
  dates: (string | undefined)[],
  windowSize: number,
): RollingPoint[] {
  if (windowSize <= 0 || ranks.length < windowSize) return []
  const points: RollingPoint[] = []
  for (let end = windowSize; end <= ranks.length; end++) {
    const window = ranks.slice(end - windowSize, end)
    points.push({
      gameNumber: end,
      date: dates[end - 1],
      firstRate: percent(window.filter((r) => r === 1).length, windowSize),
      top2Rate: percent(window.filter((r) => r <= 2).length, windowSize),
      fourthRate: percent(window.filter((r) => r === 4).length, windowSize),
    })
  }
  return points
}
