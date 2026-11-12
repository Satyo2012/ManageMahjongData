import { useCallback, useEffect, useRef, useState } from 'react'
import type { Book, NameAliasMap } from '../types'
import * as bookOps from '../domain/books'
import { fetchSharedData, type FetchedSharedData } from '../utils/sharedData'
import { clearDraft, loadDraft, loadLocalAliases, loadLocalBooks, saveDraft, saveLocal } from '../utils/storage'

/**
 * - shared: 共有データ (data.json) をそのまま表示
 * - draft:  共有データに未共有の変更あり（ブラウザに下書き保存。data.json を書き出して反映する）
 * - local:  data.json が無い環境。ブラウザ保存のみ
 */
export type DataSource = 'shared' | 'draft' | 'local'

interface StoreState {
  books: Book[]
  aliases: NameAliasMap
  source: DataSource
}

function resolveInitialState(shared: FetchedSharedData | null): StoreState {
  if (!shared) return { books: loadLocalBooks(), aliases: loadLocalAliases(), source: 'local' }

  const draft = loadDraft()
  if (draft && draft.baseSignature === shared.signature) {
    return { books: draft.books, aliases: draft.nameAliases ?? {}, source: 'draft' }
  }
  // 共有データが更新された（= 下書きを書き出して反映済み）なら古い下書きは捨てる
  if (draft) clearDraft()
  return { books: shared.data.books, aliases: shared.data.nameAliases, source: 'shared' }
}

export function useBookStore() {
  const [state, setState] = useState<StoreState | null>(null)
  const sharedRef = useRef<FetchedSharedData | null>(null)
  const dirtyRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    fetchSharedData().then((shared) => {
      if (cancelled) return
      sharedRef.current = shared
      setState(resolveInitialState(shared))
    })
    return () => {
      cancelled = true
    }
  }, [])

  // 変更があったときだけ保存する（以前は共有データ表示中の変更が再読み込みで消えていた）
  useEffect(() => {
    if (!state || !dirtyRef.current) return
    dirtyRef.current = false
    if (state.source === 'local') {
      saveLocal(state.books, state.aliases)
    } else if (sharedRef.current) {
      saveDraft({ baseSignature: sharedRef.current.signature, books: state.books, nameAliases: state.aliases })
    }
  }, [state])

  const update = useCallback((patch: (s: StoreState) => Partial<Pick<StoreState, 'books' | 'aliases'>>) => {
    dirtyRef.current = true
    setState((prev) => {
      if (!prev) return prev
      return { ...prev, ...patch(prev), source: prev.source === 'local' ? 'local' : 'draft' }
    })
  }, [])

  const upsertBook = useCallback(
    (book: Book, overwrite: boolean) =>
      update((s) => ({ books: overwrite ? bookOps.replaceBook(s.books, book) : bookOps.addBook(s.books, book) })),
    [update],
  )
  const removeBook = useCallback((id: string) => update((s) => ({ books: bookOps.removeBook(s.books, id) })), [update])
  const clearAll = useCallback(() => update(() => ({ books: [] })), [update])
  const setBookDate = useCallback(
    (id: string, date: string | undefined) => update((s) => ({ books: bookOps.setBookDate(s.books, id, date) })),
    [update],
  )
  const saveAliases = useCallback((aliases: NameAliasMap) => update(() => ({ aliases })), [update])

  const discardDraft = useCallback(() => {
    const shared = sharedRef.current
    if (!shared) return
    clearDraft()
    setState({ books: shared.data.books, aliases: shared.data.nameAliases, source: 'shared' })
  }, [])

  return {
    initializing: state === null,
    books: state?.books ?? [],
    aliases: state?.aliases ?? {},
    source: state?.source ?? 'local',
    upsertBook,
    removeBook,
    clearAll,
    setBookDate,
    saveAliases,
    discardDraft,
  }
}

export type BookStore = ReturnType<typeof useBookStore>
