export const UNKNOWN_DATE_LABEL = '日付不明'

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const COMPACT_DATE_IN_NAME = /(\d{4})(\d{2})(\d{2})/

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function toIso(year: number, month: number, day: number): string | undefined {
  // Date.UTC は範囲外の値を繰り上げるため、往復して一致するかで実在日付か判定する
  const d = new Date(Date.UTC(year, month - 1, day))
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    return undefined
  }
  return `${year}-${pad2(month)}-${pad2(day)}`
}

/** ファイル名に含まれる YYYYMMDD を YYYY-MM-DD に変換する。実在しない日付は undefined */
export function extractDateFromFileName(name: string): string | undefined {
  const match = name.match(COMPACT_DATE_IN_NAME)
  if (!match) return undefined
  return toIso(Number(match[1]), Number(match[2]), Number(match[3]))
}

export function isValidIsoDate(value: string): boolean {
  const match = value.match(ISO_DATE_PATTERN)
  if (!match) return false
  return toIso(Number(match[1]), Number(match[2]), Number(match[3])) !== undefined
}

/** 日付の昇順比較。日付不明は「最も古い」ものとして扱う */
export function compareDateAsc(a: string | undefined, b: string | undefined): number {
  if (a === b) return 0
  if (!a) return -1
  if (!b) return 1
  return a < b ? -1 : 1
}

export function formatDate(date: string | undefined): string {
  return date ?? UNKNOWN_DATE_LABEL
}

/** YYYY-MM-DD から months ヶ月前の日付。存在しない日（3/31 の1ヶ月前など）は月末に丸める */
export function subtractMonths(date: string, months: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const totalMonths = year * 12 + (month - 1) - months
  const newYear = Math.floor(totalMonths / 12)
  const newMonth = (totalMonths % 12) + 1
  const lastDay = new Date(Date.UTC(newYear, newMonth, 0)).getUTCDate()
  return `${newYear}-${pad2(newMonth)}-${pad2(Math.min(day, lastDay))}`
}

/** ローカルタイムゾーンでの今日 (YYYY-MM-DD)。toISOString は UTC なので使わない */
export function todayIso(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
}
