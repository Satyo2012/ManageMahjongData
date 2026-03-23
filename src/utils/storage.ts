import type { Game } from '../types'

const STORAGE_KEY = 'mahjong_books_v1'

export interface StoredBook {
  id: string
  fileName: string
  date?: string
  games: Game[]
  players: string[]
}

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

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
