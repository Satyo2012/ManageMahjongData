import { useState, type ChangeEvent, type DragEvent } from 'react'
import clsx from 'clsx'
import { Loader2, Upload } from 'lucide-react'

interface Props {
  onFiles: (files: File[]) => void
  busy: boolean
}

const isExcel = (f: File) => f.name.toLowerCase().endsWith('.xlsx')

export function BookDropZone({ onFiles, busy }: Props) {
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(isExcel)
    if (files.length > 0) onFiles(files)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter(isExcel)
    if (files.length > 0) onFiles(files)
    // 同じファイルを続けて選んでも change が発火するようにリセット
    e.target.value = ''
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={clsx(
        'flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors',
        dragging ? 'border-mahjong-gold bg-mahjong-gold/10' : 'border-mahjong-border hover:border-mahjong-gold/50 hover:bg-mahjong-card',
        busy && 'pointer-events-none opacity-60',
      )}
    >
      {busy ? (
        <Loader2 className="w-10 h-10 text-mahjong-gold animate-spin" />
      ) : (
        <Upload className={clsx('w-10 h-10', dragging ? 'text-mahjong-gold' : 'text-slate-400')} />
      )}
      <div className="text-center">
        <p className="font-semibold text-white">{busy ? '読み込み中...' : 'Excelファイルをドラッグ＆ドロップ'}</p>
        <p className="text-sm text-slate-300 mt-1">または クリックしてファイルを選択</p>
        <p className="text-xs text-slate-400 mt-1">複数ファイル対応 (.xlsx)・ファイル名の YYYYMMDD を対局日として読み取ります</p>
      </div>
      <input type="file" accept=".xlsx" multiple className="hidden" onChange={handleChange} disabled={busy} />
    </label>
  )
}
