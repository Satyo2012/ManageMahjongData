import { useCallback, useState } from 'react'
import { Upload, FileSpreadsheet, X } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  onFiles: (files: File[]) => void
  loading: boolean
}

export function FileUpload({ onFiles, loading }: Props) {
  const [dragging, setDragging] = useState(false)
  const [queued, setQueued] = useState<File[]>([])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const files = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith('.xlsx'))
      if (files.length > 0) {
        setQueued(files)
        onFiles(files)
      }
    },
    [onFiles],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      if (files.length > 0) {
        setQueued(files)
        onFiles(files)
      }
    },
    [onFiles],
  )

  return (
    <div className="space-y-3">
      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={clsx(
          'flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all',
          dragging
            ? 'border-[#d4af37] bg-[#d4af37]/10'
            : 'border-[#2d4a6a] hover:border-[#d4af37]/50 hover:bg-[#1e2d3d]',
        )}
      >
        <Upload
          className={clsx('w-10 h-10 transition-colors', dragging ? 'text-[#d4af37]' : 'text-[#2d4a6a]')}
        />
        <div className="text-center">
          <p className="font-semibold text-white">Excelファイルをドラッグ＆ドロップ</p>
          <p className="text-sm text-slate-400 mt-1">または クリックしてファイルを選択</p>
          <p className="text-xs text-slate-500 mt-1">複数ファイル対応 (.xlsx)</p>
        </div>
        <input
          type="file"
          accept=".xlsx"
          multiple
          className="hidden"
          onChange={handleChange}
          disabled={loading}
        />
      </label>

      {queued.length > 0 && (
        <div className="space-y-2">
          {queued.map((f) => (
            <div key={f.name} className="flex items-center gap-2 card px-3 py-2">
              <FileSpreadsheet className="w-4 h-4 text-green-400 shrink-0" />
              <span className="text-sm text-slate-300 flex-1 truncate">{f.name}</span>
              <button
                onClick={() => {
                  const next = queued.filter((q) => q.name !== f.name)
                  setQueued(next)
                  onFiles(next)
                }}
                className="text-slate-500 hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
