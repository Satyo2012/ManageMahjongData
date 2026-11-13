import type { Book, NameAliasMap } from '../types/index.ts'
import { sortBooksByDate } from './books.ts'

export const SHARED_DATA_VERSION = 1

/** public/data.json の形式 */
export interface SharedData {
  version: number
  exportedAt: string
  books: Book[]
  nameAliases: NameAliasMap
}

/**
 * data.json の文字列を作る。アプリからの書き出しと自動同期で同じ形式にするため共通化。
 * 日付順に並べておくと Git の差分が追記中心になり確認しやすい。
 */
export function serializeSharedData(books: Book[], nameAliases: NameAliasMap, exportedAt: string): string {
  const payload: SharedData = {
    version: SHARED_DATA_VERSION,
    exportedAt,
    books: sortBooksByDate(books),
    nameAliases,
  }
  return JSON.stringify(payload, null, 2) + '\n'
}
