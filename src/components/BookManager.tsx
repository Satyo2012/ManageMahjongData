import { useCallback, useState } from 'react'
import {
  Upload, FileSpreadsheet, Trash2, AlertTriangle,
  CheckCircle2, RefreshCw, CalendarDays, Trash,
} from 'lucide-react'
import clsx from 'clsx'
import { sortBooksByDate, type StoredBook } from '../utils/storage'

interface DuplicateInfo {
  file: File
  existing: StoredBook
}

interface Props {
  books: StoredBook[]
  onAddBook: (file: File, overwrite: boolean) => Promise<void>
  onRemoveBook: (id: string) => void
  onClearAll: () => void
  loading: boolean
}

export function BookManager({ books, onAddBook, onRemoveBook, onClearAll, loading }: Props) {
  const [dragging, setDragging] = useState(false)
  const [duplicates, setDuplicates] = useState<DuplicateInfo[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmClearAll, setConfirmClearAll] = useState(false)

  const processFiles = useCallback(
    (files: File[]) => {
      const dupes: DuplicateInfo[] = []
      const unique: File[] = []
      for (const file of files) {
        const existing = books.find((b) => b.fileName === file.name)
        if (existing) dupes.push({ file, existing })
        else unique.push(file)
      }
      for (const file of unique) onAddBook(file, false)
      if (dupes.length > 0) {
        setDuplicates(dupes)
        setPendingFiles(dupes.map((d) => d.file))
      }
    },
    [books, onAddBook],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const files = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith('.xlsx'))
      if (files.length > 0) processFiles(files)
    },
    [processFiles],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []).filter((f) => f.name.endsWith('.xlsx'))
      if (files.length > 0) processFiles(files)
      e.target.value = ''
    },
    [processFiles],
  )

  const handleDuplicateAction = useCallback(
    async (info: DuplicateInfo, overwrite: boolean) => {
      if (overwrite) await onAddBook(info.file, true)
      setDuplicates((prev) => prev.filter((d) => d.file.name !== info.file.name))
      setPendingFiles((prev) => prev.filter((f) => f.name !== info.file.name))
    },
    [onAddBook],
  )

  const handleSkipAll = useCallback(() => { setDuplicates([]); setPendingFiles([]) }, [])
  const handleOverwriteAll = useCallback(async () => {
    for (const info of duplicates) await onAddBook(info.file, true)
    setDuplicates([]); setPendingFiles([])
  }, [duplicates, onAddBook])

  const sortedBooks = sortBooksByDate(books)

  return (
    <div className="space-y-5">
      {/* ドラッグ&ドロップエリア */}
      <label
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={clsx(
          'flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all',
          dragging ? 'border-[#d4af37] bg-[#d4af37]/10' : 'border-[#2d4a6a] hover:border-[#d4af37]/50 hover:bg-[#1e2d3d]',
          loading && 'pointer-events-none opacity-60',
        )}
      >
        <Upload className={clsx('w-10 h-10 transition-colors', dragging ? 'text-[#d4af37]' : 'text-[#2d4a6a]')} />
        <div className="text-center">
          <p className="font-semibold text-white">Excelファイルをドラッグ＆ドロップ</p>
          <p className="text-sm text-slate-400 mt-1">または クリックしてファイルを選択</p>
          <p className="text-xs text-slate-500 mt-1">複数ファイル対応 (.xlsx) — データはブラウザに保存されます</p>
        </div>
        <input type="file" accept=".xlsx" multiple className="hidden" onChange={handleChange} disabled={loading} />
      </label>

      {/* 重複検知ダイアログ */}
      {duplicates.length > 0 && (
        <div className="card border-amber-700/60 bg-amber-900/10 p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <AlertTriangle className="w-5 h-5" />
            <span>重複ファイルが検出されました ({duplicates.length}件)</span>
          </div>
          {duplicates.map((info) => (
            <div key={info.file.name} className="bg-[#1e2d3d] rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-sm text-slate-200 font-medium truncate">{info.file.name}</span>
              </div>
              <p className="text-xs text-slate-400">このファイルは既に読み込まれています。上書きしますか？</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDuplicateAction(info, true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-amber-600 hover:bg-amber-500 text-white transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />上書き
                </button>
                <button
                  onClick={() => handleDuplicateAction(info, false)}
                  className="px-3 py-1.5 rounded-lg text-xs card hover:border-slate-500 text-slate-400 transition-colors"
                >
                  スキップ
                </button>
              </div>
            </div>
          ))}
          {duplicates.length > 1 && (
            <div className="flex gap-2 pt-1 border-t border-amber-700/30">
              <button onClick={handleOverwriteAll} className="px-3 py-1.5 rounded-lg text-xs bg-amber-600 hover:bg-amber-500 text-white transition-colors">
                すべて上書き
              </button>
              <button onClick={handleSkipAll} className="px-3 py-1.5 rounded-lg text-xs card hover:border-slate-500 text-slate-400 transition-colors">
                すべてスキップ
              </button>
            </div>
          )}
        </div>
      )}

      {/* 読み込み済みブック一覧 */}
      {books.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              読み込み済みブック ({books.length}件)
              <span className="text-xs text-slate-500 font-normal flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />日付昇順
              </span>
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                計 {books.reduce((a, b) => a + b.games.length, 0)} 局
              </span>
              {/* 一括削除ボタン */}
              {confirmClearAll ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-red-400">全データを削除しますか？</span>
                  <button
                    onClick={() => { onClearAll(); setConfirmClearAll(false) }}
                    className="px-2 py-1 rounded text-xs bg-red-700 hover:bg-red-600 text-white transition-colors"
                  >
                    削除
                  </button>
                  <button
                    onClick={() => setConfirmClearAll(false)}
                    className="px-2 py-1 rounded text-xs card text-slate-400 hover:border-slate-500 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClearAll(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-red-500 hover:text-red-400 hover:bg-red-900/20 border border-red-900/40 hover:border-red-700/60 transition-colors"
                  title="全データを一括削除"
                >
                  <Trash className="w-3 h-3" />
                  全削除
                </button>
              )}
            </div>
          </div>

          {sortedBooks.map((book) => (
            <div key={book.id} className="flex items-center gap-2 card px-3 py-2.5 group">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 truncate">{book.fileName}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <CalendarDays className="w-3 h-3 text-[#d4af37]" />
                  <span className="text-[#d4af37]">{book.date ?? '日付不明'}</span>
                  <span>・ {book.games.length} 局</span>
                  <span>・ {book.players.join(' / ')}</span>
                </p>
              </div>

              {confirmDeleteId === book.id ? (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-red-400 mr-1">削除しますか？</span>
                  <button
                    onClick={() => { onRemoveBook(book.id); setConfirmDeleteId(null) }}
                    className="px-2 py-1 rounded text-xs bg-red-700 hover:bg-red-600 text-white transition-colors"
                  >
                    削除
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-2 py-1 rounded text-xs card text-slate-400 hover:border-slate-500 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(book.id)}
                  className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                  title="このブックを削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {books.length === 0 && pendingFiles.length === 0 && (
        <p className="text-center text-slate-600 text-sm py-4">
          まだファイルが読み込まれていません
        </p>
      )}
    </div>
  )
}
