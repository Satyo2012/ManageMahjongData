import type { Book } from '../types/index.ts'
import { compareDateAsc } from './date.ts'

/** ブックを日付順に並べる（日付不明は最古扱い。同日はファイル名順） */
export function sortBooksByDate(books: Book[], direction: 'asc' | 'desc' = 'asc'): Book[] {
  const sorted = [...books].sort(
    (a, b) => compareDateAsc(a.date, b.date) || a.fileName.localeCompare(b.fileName, 'ja'),
  )
  return direction === 'asc' ? sorted : sorted.reverse()
}

export function addBook(books: Book[], book: Book): Book[] {
  return [...books, book]
}

/** 同じファイル名のブックを差し替える。存在しなければ追加する */
export function replaceBook(books: Book[], book: Book): Book[] {
  const exists = books.some((b) => b.fileName === book.fileName)
  if (!exists) return addBook(books, book)
  return books.map((b) => (b.fileName === book.fileName ? book : b))
}

export function removeBook(books: Book[], id: string): Book[] {
  return books.filter((b) => b.id !== id)
}

/** ブックの日付を変更する。各対局の日付も合わせて更新する */
export function setBookDate(books: Book[], id: string, date: string | undefined): Book[] {
  return books.map((b) =>
    b.id === id ? { ...b, date, games: b.games.map((g) => ({ ...g, date })) } : b,
  )
}

export function findBookByFileName(books: Book[], fileName: string): Book | undefined {
  return books.find((b) => b.fileName === fileName)
}
