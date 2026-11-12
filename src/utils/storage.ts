import type { Book, NameAliasMap } from '../types'

/** ローカルモード（data.json が無い環境）でのブック・エイリアス */
const BOOKS_KEY = 'mahjong_books_v1'
const ALIAS_KEY = 'mahjong_name_aliases_v1'
/** 共有データを元にした未共有の変更（下書き） */
const DRAFT_KEY = 'mahjong_shared_draft_v1'

export interface SharedDraft {
  /** 下書きの元になった共有データの署名。共有データが更新されたら下書きは破棄する */
  baseSignature: string
  books: Book[]
  nameAliases: NameAliasMap
}

function readJson<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : undefined
  } catch (e) {
    console.warn(`localStorage(${key}) の読み込みに失敗しました`, e)
    return undefined
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error(`localStorage(${key}) への保存に失敗しました`, e)
  }
}

function removeKey(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (e) {
    console.error(`localStorage(${key}) の削除に失敗しました`, e)
  }
}

export function loadLocalBooks(): Book[] {
  const books = readJson<Book[]>(BOOKS_KEY)
  return Array.isArray(books) ? books : []
}

export function loadLocalAliases(): NameAliasMap {
  return readJson<NameAliasMap>(ALIAS_KEY) ?? {}
}

export function saveLocal(books: Book[], aliases: NameAliasMap): void {
  writeJson(BOOKS_KEY, books)
  writeJson(ALIAS_KEY, aliases)
}

export function loadDraft(): SharedDraft | undefined {
  const draft = readJson<SharedDraft>(DRAFT_KEY)
  return draft && Array.isArray(draft.books) ? draft : undefined
}

export function saveDraft(draft: SharedDraft): void {
  writeJson(DRAFT_KEY, draft)
}

export function clearDraft(): void {
  removeKey(DRAFT_KEY)
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
