import { useState } from 'react'
import { CalendarDays, Check, FileSpreadsheet, Pencil, Trash2, X } from 'lucide-react'
import type { Book } from '../../types'
import { isValidIsoDate } from '../../domain/date'
import { isCompleteGame } from '../../domain/stats'

interface Props {
  book: Book
  onRemove: (id: string) => void
  onSetDate: (id: string, date: string | undefined) => void
}

function DateEditor({ initial, onSave, onCancel }: { initial: string; onSave: (date: string | undefined) => void; onCancel: () => void }) {
  const [value, setValue] = useState(initial)
  const valid = value === '' || isValidIsoDate(value)
  return (
    <span className="inline-flex items-center gap-1">
      <input type="date" value={value} onChange={(e) => setValue(e.target.value)} className="input py-0.5 text-xs" aria-label="対局日" autoFocus />
      <button type="button" disabled={!valid} onClick={() => onSave(value || undefined)} className="btn-primary px-1.5 py-0.5" aria-label="日付を保存">
        <Check className="w-3.5 h-3.5" />
      </button>
      <button type="button" onClick={onCancel} className="btn-ghost px-1.5 py-0.5" aria-label="キャンセル">
        <X className="w-3.5 h-3.5" />
      </button>
    </span>
  )
}

export function BookRow({ book, onRemove, onSetDate }: Props) {
  const [editingDate, setEditingDate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const incomplete = book.games.filter((g) => !isCompleteGame(g)).length

  return (
    <div className="flex items-center gap-3 card px-3 py-2.5">
      <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm text-slate-100 truncate" title={book.fileName}>{book.fileName}</p>
        <div className="text-xs text-slate-300 flex items-center gap-x-2 gap-y-1 flex-wrap">
          {editingDate ? (
            <DateEditor
              initial={book.date ?? ''}
              onSave={(date) => {
                onSetDate(book.id, date)
                setEditingDate(false)
              }}
              onCancel={() => setEditingDate(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingDate(true)}
              className={book.date ? 'inline-flex items-center gap-1 text-mahjong-gold hover:underline' : 'inline-flex items-center gap-1 text-amber-300 bg-amber-900/40 border border-amber-700/60 rounded px-1.5 hover:bg-amber-800/40'}
              title="対局日を変更"
            >
              <CalendarDays className="w-3 h-3" />
              {book.date ?? '日付未設定 — クリックして設定'}
              {book.date && <Pencil className="w-3 h-3 opacity-60" />}
            </button>
          )}
          <span>{book.games.length}局</span>
          {book.games.length === 0 && <span className="text-red-400">対局データなし</span>}
          {incomplete > 0 && <span className="text-amber-400" title="4人分の結果が揃っていない行は集計から除外されます">不完全な行 {incomplete}件（集計対象外）</span>}
          <span className="text-slate-400 truncate">{book.players.join(' / ')}</span>
        </div>
      </div>

      {confirmDelete ? (
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-red-400 mr-1">削除しますか？</span>
          <button type="button" onClick={() => onRemove(book.id)} className="btn-danger text-xs px-2 py-1">削除</button>
          <button type="button" onClick={() => setConfirmDelete(false)} className="btn-ghost text-xs px-2 py-1">キャンセル</button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="text-slate-500 hover:text-red-400 transition-colors shrink-0 p-1"
          title="このブックを削除"
          aria-label={`${book.fileName} を削除`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
