import type { Game, NameAliasMap } from '../types'

const STORAGE_KEY = 'mahjong_books_v1'
const ALIAS_KEY = 'mahjong_name_aliases_v1'

export interface StoredBook {
  id: string
  fileName: string
  date?: string
  games: Game[]
  players: string[]
}

// ─── Books ───────────────────────────────────────────────

export function loadStoredBooks(): StoredBook[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as StoredBook[]
  } catch {
    return []
  }
}

export function saveBooks(books: StoredBook[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books))
  } catch (e) {
    console.error('localStorage への保存に失敗しました', e)
  }
}

export function addBook(books: StoredBook[], newBook: StoredBook): StoredBook[] {
  const next = [...books, newBook]
  saveBooks(next)
  return next
}

export function removeBook(books: StoredBook[], id: string): StoredBook[] {
  const next = books.filter((b) => b.id !== id)
  saveBooks(next)
  return next
}

export function replaceBook(books: StoredBook[], newBook: StoredBook): StoredBook[] {
  const next = books.map((b) => (b.fileName === newBook.fileName ? newBook : b))
  saveBooks(next)
  return next
}

/** 全ブックを削除 */
export function clearAllBooks(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// ─── Name Aliases ─────────────────────────────────────────

export function loadNameAliases(): NameAliasMap {
  try {
    const raw = localStorage.getItem(ALIAS_KEY)
    return raw ? (JSON.parse(raw) as NameAliasMap) : {}
  } catch {
    return {}
  }
}

export function saveNameAliases(aliases: NameAliasMap): void {
  try {
    localStorage.setItem(ALIAS_KEY, JSON.stringify(aliases))
  } catch (e) {
    console.error('名前エイリアスの保存に失敗しました', e)
  }
}

// ─── Utilities ───────────────────────────────────────────

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** ブックを日付昇順でソート（日付なしは先頭） */
export function sortBooksByDate(books: StoredBook[]): StoredBook[] {
  return [...books].sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return -1
    if (!b.date) return 1
    return a.date.localeCompare(b.date)
  })
}
