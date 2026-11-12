/** 符号付きで表示（+12.3 / -4.5 / 0.0） */
export function formatSigned(value: number, digits = 1): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(digits)}`
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

/** スコアの正負に応じた文字色クラス */
export function scoreTextClass(value: number): string {
  if (value > 0) return 'text-emerald-400'
  if (value < 0) return 'text-red-400'
  return 'text-slate-300'
}

/** 表示用にファイル名を短くする（「麻雀集計表」「Google ドライブ」「.xlsx」を除去） */
export function shortFileName(fileName: string): string {
  return fileName
    .replace('麻雀集計表', '')
    .replace(/\s*-\s*Google ドライブ/, '')
    .replace(/\.xlsx$/, '')
    .trim()
}
