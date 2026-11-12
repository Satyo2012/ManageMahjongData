import type { Book, NameAliasMap } from '../types'
import { sortBooksByDate } from '../domain/books'
import { todayIso } from '../domain/date'
import { downloadBlob } from './download'

export const SHARED_DATA_FILE = 'data.json'
const SHARED_DATA_VERSION = 1

export interface SharedData {
  version: number
  exportedAt: string
  books: Book[]
  nameAliases: NameAliasMap
}

export interface FetchedSharedData {
  data: SharedData
  /** 内容のハッシュ。ローカルの下書きがどの版を元にしたかの判定に使う */
  signature: string
}

/** FNV-1a (32bit)。改ざん検知ではなく「同じ内容か」の判定用 */
function hashText(text: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16)
}

/** 共有用 data.json をダウンロード（public/ に置いて Git にコミットする） */
export function exportSharedJson(books: Book[], nameAliases: NameAliasMap): void {
  const payload: SharedData = {
    version: SHARED_DATA_VERSION,
    exportedAt: todayIso(),
    // 日付順にしておくと Git の差分が追記中心になり確認しやすい
    books: sortBooksByDate(books),
    nameAliases,
  }
  const json = JSON.stringify(payload, null, 2) + '\n'
  downloadBlob(new Blob([json], { type: 'application/json' }), SHARED_DATA_FILE)
}

/** data.json を取得する。存在しない・壊れている場合は null */
export async function fetchSharedData(): Promise<FetchedSharedData | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}${SHARED_DATA_FILE}`, { cache: 'no-cache' })
    if (!res.ok) return null
    const text = await res.text()
    const data = JSON.parse(text) as SharedData
    if (!Array.isArray(data.books)) return null
    return { data: { ...data, nameAliases: data.nameAliases ?? {} }, signature: hashText(text) }
  } catch (e) {
    // 開発環境で data.json が無い場合など。ローカルモードで動作する
    console.info('共有データ (data.json) を読み込めませんでした', e)
    return null
  }
}
