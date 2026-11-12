import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Trash } from 'lucide-react'
import type { Book } from '../../types'
import { sortBooksByDate } from '../../domain/books'
import { BookRow } from './BookRow'

interface Props {
  books: Book[]
  onRemove: (id: string) => void
  onClearAll: () => void
  onSetDate: (id: string, date: string | undefined) => void
}

/** 読み込み済みブック一覧（新しい順。日付未設定は末尾） */
export function BookList({ books, onRemove, onClearAll, onSetDate }: Props) {
  const [confirmClear, setConfirmClear] = useState(false)
  const sorted = useMemo(() => sortBooksByDate(books, 'desc'), [books])
  const undated = books.filter((b) => !b.date)
  const totalGames = books.reduce((a, b) => a + b.games.length, 0)

  if (books.length === 0) {
    return <p className="text-center text-slate-400 text-sm py-4">まだファイルが読み込まれていません</p>
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          読み込み済みブック（{books.length}件 / {totalGames}局・新しい順）
        </h3>
        {confirmClear ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-red-400">全データを削除しますか？</span>
            <button type="button" onClick={() => { onClearAll(); setConfirmClear(false) }} className="btn-danger text-xs px-2 py-1">削除</button>
            <button type="button" onClick={() => setConfirmClear(false)} className="btn-ghost text-xs px-2 py-1">キャンセル</button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="btn text-xs px-2.5 py-1 text-red-400 border border-red-900/50 hover:bg-red-900/20 hover:border-red-700/60"
          >
            <Trash className="w-3 h-3" />
            全削除
          </button>
        )}
      </div>

      {undated.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-amber-300 bg-amber-900/20 border border-amber-700/50 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            日付未設定のブックが {undated.length}件あります（{undated.map((b) => b.fileName).join('、')}）。
            最も古い対局として扱われ、期間フィルター・月次集計からは除外されます。日付をクリックして対局日を設定してください。
          </span>
        </div>
      )}

      {sorted.map((book) => (
        <BookRow key={book.id} book={book} onRemove={onRemove} onSetDate={onSetDate} />
      ))}
    </div>
  )
}
