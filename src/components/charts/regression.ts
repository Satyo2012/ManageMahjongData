export interface LinearFit {
  slope: number
  intercept: number
}

/** 最小二乗法による回帰直線。点が2つ未満、または x が全て同じなら null */
export function linearRegression(xs: number[], ys: number[]): LinearFit | null {
  const n = xs.length
  if (n < 2) return null
  const sx = xs.reduce((a, b) => a + b, 0)
  const sy = ys.reduce((a, b) => a + b, 0)
  const sxy = xs.reduce((a, x, i) => a + x * ys[i], 0)
  const sxx = xs.reduce((a, x) => a + x * x, 0)
  const denom = n * sxx - sx * sx
  if (denom === 0) return null
  const slope = (n * sxy - sx * sy) / denom
  return { slope, intercept: (sy - slope * sx) / n }
}
