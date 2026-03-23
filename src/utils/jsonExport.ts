import type { NameAliasMap } from '../types'
import type { StoredBook } from './storage'

export interface SharedData {
  version: number
  exportedAt: string
  books: StoredBook[]
  nameAliases: NameAliasMap
}

/** 共有用 data.json をダウンロード（public/ に置いてGitにコミットする） */
export function exportSharedJson(books: StoredBook[], nameAliases: NameAliasMap) {
  const payload: SharedData = {
    version: 1,
    exportedAt: new Date().toISOString().slice(0, 10),
    books,
    nameAliases,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: 'data.json',
  })
  a.click()
  URL.revokeObjectURL(a.href)
}

/** /data.json をフェッチして SharedData を返す。存在しなければ null */
export async function fetchSharedData(): Promise<SharedData | null> {
  try {
    const res = await fetch('/data.json', { cache: 'no-cache' })
    if (!res.ok) return null
    const json = await res.json() as SharedData
    if (!Array.isArray(json.books)) return null
    return json
  } catch {
    return null
  }
}
