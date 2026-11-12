import { AlertTriangle, FileSpreadsheet, RefreshCw } from 'lucide-react'

interface Props {
  files: File[]
  onOverwrite: (files: File[]) => void
  onSkip: (files: File[]) => void
}

/** 読み込み済みと同名のファイルを上書きするか確認する */
export function DuplicatePrompt({ files, onOverwrite, onSkip }: Props) {
  if (files.length === 0) return null
  return (
    <div className="card border-amber-700/60 bg-amber-900/10 p-4 space-y-3" role="alertdialog" aria-label="重複ファイルの確認">
      <div className="flex items-center gap-2 text-amber-400 font-bold">
        <AlertTriangle className="w-5 h-5" />
        読み込み済みのファイルと同名です（{files.length}件）
      </div>
      {files.map((file) => (
        <div key={file.name} className="bg-mahjong-card rounded-lg p-3 flex items-center gap-3 flex-wrap">
          <FileSpreadsheet className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-sm text-slate-100 font-medium truncate flex-1 min-w-0">{file.name}</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => onOverwrite([file])} className="btn text-xs bg-amber-600 hover:bg-amber-500 text-white">
              <RefreshCw className="w-3 h-3" />
              上書き
            </button>
            <button type="button" onClick={() => onSkip([file])} className="btn-ghost text-xs">
              スキップ
            </button>
          </div>
        </div>
      ))}
      {files.length > 1 && (
        <div className="flex gap-2 pt-2 border-t border-amber-700/30">
          <button type="button" onClick={() => onOverwrite(files)} className="btn text-xs bg-amber-600 hover:bg-amber-500 text-white">
            すべて上書き
          </button>
          <button type="button" onClick={() => onSkip(files)} className="btn-ghost text-xs">
            すべてスキップ
          </button>
        </div>
      )}
    </div>
  )
}
