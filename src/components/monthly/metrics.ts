import type { PeriodPlayerStat } from '../../domain/periodic'
import { formatSigned } from '../../utils/format'

/** 4人打ちの期待値（平均着順 2.5 / 1着率 25%） */
const EXPECTED_AVG_RANK = 2.5
const EXPECTED_FIRST_RATE = 25

export type MetricKey = 'avgScore' | 'totalScore' | 'avgRank' | 'firstRate'

export interface MetricDef {
  label: string
  format: (v: number) => string
  isGood: (v: number) => boolean
  /** 小さいほど良い指標はグラフの縦軸を反転する */
  lowerIsBetter?: boolean
  domain?: [number, number]
}

export const METRICS: Record<MetricKey, MetricDef> = {
  avgScore: { label: '平均スコア', format: (v) => formatSigned(v, 1), isGood: (v) => v > 0 },
  totalScore: { label: '合計スコア', format: (v) => formatSigned(v, 1), isGood: (v) => v > 0 },
  avgRank: {
    label: '平均着順',
    format: (v) => v.toFixed(2),
    isGood: (v) => v < EXPECTED_AVG_RANK,
    lowerIsBetter: true,
    domain: [1, 4],
  },
  firstRate: { label: '1着率', format: (v) => `${v.toFixed(1)}%`, isGood: (v) => v > EXPECTED_FIRST_RATE, domain: [0, 100] },
}

export const METRIC_KEYS = Object.keys(METRICS) as MetricKey[]

export function metricValue(stat: PeriodPlayerStat | undefined, key: MetricKey): number | undefined {
  return stat?.[key]
}
