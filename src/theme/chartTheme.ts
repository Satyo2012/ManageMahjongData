/** Recharts 用の共通スタイル（Tailwind のクラスが使えない箇所用） */
export const CHART_COLORS = {
  gold: '#d4af37',
  grid: '#2d4a6a',
  axis: '#4a6080',
  tick: '#a3b3c4',
  axisLabel: '#8da0b5',
  zeroLine: '#64748b',
  positive: '#34d399',
  negative: '#f87171',
} as const

export const AXIS_PROPS = {
  stroke: CHART_COLORS.axis,
  tick: { fill: CHART_COLORS.tick, fontSize: 11 },
} as const

export const GRID_PROPS = { strokeDasharray: '3 3', stroke: CHART_COLORS.grid } as const

export const TOOLTIP_PROPS = {
  contentStyle: {
    backgroundColor: '#132233',
    border: `1px solid ${CHART_COLORS.grid}`,
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: CHART_COLORS.gold, fontWeight: 600, marginBottom: 4 },
  itemStyle: { padding: 0 },
  wrapperStyle: { zIndex: 30 },
} as const

export const RANK_COLORS: Record<number, string> = {
  1: '#eab308',
  2: '#94a3b8',
  3: '#d97706',
  4: '#dc2626',
}

/** 「n局目」の軸ラベル */
export function axisLabel(value: string) {
  return { value, position: 'insideBottomRight' as const, offset: -4, fill: CHART_COLORS.axisLabel, fontSize: 11 }
}

/** 直対ページの2人の色（どの組み合わせでも見分けやすい固定色） */
export const H2H_COLORS = { a: '#60a5fa', b: '#f472b6' } as const
