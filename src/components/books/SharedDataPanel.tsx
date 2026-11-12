import { useState } from 'react'
import { Download, GitBranch, RotateCcw, Share2 } from 'lucide-react'
import type { Book, NameAliasMap } from '../../types'
import type { DataSource } from '../../hooks/useBookStore'
import { exportSharedJson } from '../../utils/sharedData'

interface Props {
  source: DataSource
  books: Book[]
  aliases: NameAliasMap
  onDiscardDraft: () => void
}

const GIT_COMMAND = 'git add public/data.json && git commit -m "update data" && git push'

const STATUS: Record<DataSource, { title: string; body: string; tone: string }> = {
  shared: {
    title: '共有データ（Git 管理の data.json）を表示中',
    body: 'ここでファイルを追加・修正すると、このブラウザに下書きとして保存されます（再読み込みしても消えません）。',
    tone: 'border-emerald-800/50 bg-emerald-900/10 text-emerald-300',
  },
  draft: {
    title: '未共有の変更があります',
    body: '下の手順で data.json を Git に反映すると全員に共有されます。反映後に再読み込みすると下書きは自動で破棄されます。',
    tone: 'border-amber-700/60 bg-amber-900/15 text-amber-300',
  },
  local: {
    title: 'このブラウザだけに保存しています',
    body: 'data.json が見つかりません。共有するには data.json を書き出してリポジトリの public/ に置いてください。',
    tone: 'border-mahjong-border bg-mahjong-card text-slate-200',
  },
}

/** 共有データ (data.json) の状態表示と、Git への反映手順 */
export function SharedDataPanel({ source, books, aliases, onDiscardDraft }: Props) {
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const status = STATUS[source]

  return (
    <div className={`card p-4 space-y-3 ${status.tone}`}>
      <p className="text-sm font-semibold flex items-center gap-2">
        <Share2 className="w-4 h-4" />
        {status.title}
      </p>
      <p className="text-xs text-slate-300">{status.body}</p>

      {source !== 'shared' && books.length > 0 && (
        <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
          <li>
            <button type="button" onClick={() => exportSharedJson(books, aliases)} className="btn text-xs bg-emerald-700 hover:bg-emerald-600 text-white ml-1">
              <Download className="w-3.5 h-3.5" />
              data.json をダウンロード
            </button>
          </li>
          <li>リポジトリの <code className="text-emerald-300">public/data.json</code> を置き換える</li>
          <li className="space-y-1">
            <span className="inline-flex items-center gap-1"><GitBranch className="w-3.5 h-3.5" />コミットして push（Vercel が自動で再デプロイ）</span>
            <code className="block bg-mahjong-dark border border-mahjong-border rounded px-2 py-1.5 text-emerald-300 select-all overflow-x-auto whitespace-nowrap">{GIT_COMMAND}</code>
          </li>
        </ol>
      )}

      {source === 'draft' &&
        (confirmDiscard ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-red-400">未共有の変更をすべて破棄しますか？（元に戻せません）</span>
            <button type="button" onClick={() => { onDiscardDraft(); setConfirmDiscard(false) }} className="btn-danger text-xs px-2 py-1">破棄</button>
            <button type="button" onClick={() => setConfirmDiscard(false)} className="btn-ghost text-xs px-2 py-1">キャンセル</button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmDiscard(true)} className="btn-ghost text-xs">
            <RotateCcw className="w-3.5 h-3.5" />
            変更を破棄して共有データに戻す
          </button>
        ))}
    </div>
  )
}
