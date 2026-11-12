import { useState } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { BookStore } from '../hooks/useBookStore'
import { useExcelImport } from '../hooks/useExcelImport'
import { findBookByFileName } from '../domain/books'
import { BookDropZone } from '../components/books/BookDropZone'
import { DuplicatePrompt } from '../components/books/DuplicatePrompt'
import { BookList } from '../components/books/BookList'
import { SharedDataPanel } from '../components/books/SharedDataPanel'
import { NameSettings } from '../components/NameSettings'

interface Props {
  store: BookStore
  onGoDashboard?: () => void
}

const uniqueByName = (files: File[]) => files.filter((f, i) => files.findIndex((x) => x.name === f.name) === i)

export function UploadPage({ store, onGoDashboard }: Props) {
  const { importFiles, importing, messages } = useExcelImport(store.upsertBook)
  const [duplicates, setDuplicates] = useState<File[]>([])

  const handleFiles = (files: File[]) => {
    const unique = uniqueByName(files)
    const dupes = unique.filter((f) => findBookByFileName(store.books, f.name))
    importFiles(unique.filter((f) => !dupes.includes(f)), false)
    setDuplicates((prev) => uniqueByName([...prev, ...dupes]))
  }

  const resolveDuplicates = (files: File[], overwrite: boolean) => {
    if (overwrite) importFiles(files, true)
    setDuplicates((prev) => prev.filter((f) => !files.includes(f)))
  }

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-mahjong-gold">ファイル管理</h2>
        <p className="text-slate-300 mt-2 text-sm">麻雀集計表の Excel ファイルを読み込み、共有データ (data.json) を更新します</p>
      </div>

      <BookDropZone onFiles={handleFiles} busy={importing} />

      {messages.length > 0 && (
        <ul className="space-y-1" aria-live="polite">
          {messages.map((m) => (
            <li key={m.text} className={`flex items-center gap-2 text-sm ${m.kind === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>
              {m.kind === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {m.text}
            </li>
          ))}
          {onGoDashboard && messages.some((m) => m.kind === 'success') && (
            <li>
              <button type="button" onClick={onGoDashboard} className="text-sm text-mahjong-gold hover:underline">
                ダッシュボードで確認する →
              </button>
            </li>
          )}
        </ul>
      )}

      <DuplicatePrompt
        files={duplicates}
        onOverwrite={(files) => resolveDuplicates(files, true)}
        onSkip={(files) => resolveDuplicates(files, false)}
      />

      <SharedDataPanel source={store.source} books={store.books} aliases={store.aliases} onDiscardDraft={store.discardDraft} />

      <NameSettings books={store.books} aliases={store.aliases} onSave={store.saveAliases} />

      <BookList books={store.books} onRemove={store.removeBook} onClearAll={store.clearAll} onSetDate={store.setBookDate} />
    </div>
  )
}
