/** 小数第 digits 位で四捨五入 */
export function round(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0)
}

export function average(values: number[]): number {
  return values.length > 0 ? sum(values) / values.length : 0
}

/** 割合を % (小数第1位) で返す */
export function percent(count: number, total: number): number {
  return total > 0 ? round((count / total) * 100, 1) : 0
}
