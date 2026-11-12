import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Merge, RotateCcw, Save, UserCog } from 'lucide-react'
import type { Book, NameAliasMap } from '../types'

interface Props {
  books: Book[]
  aliases: NameAliasMap
  onSave: (aliases: NameAliasMap) => void
}

const SAVED_MESSAGE_MS = 2000

function AliasEditor({ books, aliases, onSave }: Props) {
  // パネルを開くたびにマウントされるので、初期値は開いた時点の aliases
  const [draft, setDraft] = useState<NameAliasMap>(() => ({ ...aliases }))
  const [saved, setSaved] = useState(false)

  const rawNames = useMemo(() => [...new Set(books.flatMap((b) => b.players))].sort((a, b) => a.localeCompare(b, 'ja')), [books])
  const appearances = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const b of books) for (const p of b.players) map.set(p, [...(map.get(p) ?? []), b.date ?? b.fileName])
    return map
  }, [books])
  const mergeGroups = useMemo(() => {
    const groups: Record<string, string[]> = {}
    for (const raw of rawNames) (groups[draft[raw] ?? raw] ??= []).push(raw)
    return Object.entries(groups).filter(([, members]) => members.length > 1)
  }, [rawNames, draft])

  const handleChange = (raw: string, value: string) => {
    setDraft((prev) => {
      const next = { ...prev }
      const trimmed = value.trim()
      // 空欄または元の名前と同じなら、エイリアス不要
      if (trimmed === '' || trimmed === raw) delete next[raw]
      else next[raw] = trimmed
      return next
    })
    setSaved(false)
  }

  const handleSave = () => {
    onSave(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), SAVED_MESSAGE_MS)
  }

  return (
    <div className="px-4 pb-4 space-y-4 border-t border-mahjong-border pt-4">
      <p className="text-xs text-slate-300">
        ブックによって表記が異なる名前を統合できます。「統合後の名前」を同じにすると同一プレイヤーとして集計されます。
      </p>
      <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-mahjong-card">
            <tr className="text-slate-300 text-xs border-b border-mahjong-border">
              <th className="text-left py-2 pr-4">検出された名前</th>
              <th className="text-left py-2 pr-4">登場</th>
              <th className="text-left py-2">統合後の名前</th>
            </tr>
          </thead>
          <tbody>
            {rawNames.map((raw) => {
              const current = draft[raw] ?? raw
              const sessions = appearances.get(raw) ?? []
              return (
                <tr key={raw} className="border-b border-mahjong-border/40">
                  <td className="py-2 pr-4 text-slate-100 font-medium whitespace-nowrap">{raw}</td>
                  <td className="py-2 pr-4 text-xs text-slate-400 whitespace-nowrap" title={sessions.join(', ')}>
                    {sessions.length}回
                  </td>
                  <td className="py-2">
                    <input
                      type="text"
                      value={current}
                      onChange={(e) => handleChange(raw, e.target.value)}
                      className={`input w-full ${current !== raw ? 'border-mahjong-gold/60 text-mahjong-gold' : ''}`}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {mergeGroups.length > 0 && (
        <div className="bg-mahjong-panel rounded-lg p-3 space-y-1.5">
          <p className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
            <Merge className="w-3.5 h-3.5 text-emerald-400" />
            統合プレビュー
          </p>
          {mergeGroups.map(([canonical, members]) => (
            <p key={canonical} className="text-xs text-slate-300">
              <span className="text-emerald-400 font-bold">{canonical}</span>
              <span className="text-slate-400"> ← </span>
              {members.join(' + ')}
            </p>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button type="button" onClick={handleSave} className={saved ? 'btn bg-emerald-700 text-white' : 'btn-primary'}>
          <Save className="w-3.5 h-3.5" />
          {saved ? '保存しました' : '保存して適用'}
        </button>
        <button type="button" onClick={() => setDraft({})} className="btn-ghost">
          <RotateCcw className="w-3.5 h-3.5" />
          すべて解除
        </button>
      </div>
    </div>
  )
}

/** 名前の表記ゆれ設定（折りたたみパネル） */
export function NameSettings(props: Props) {
  const [open, setOpen] = useState(false)
  const aliasCount = Object.keys(props.aliases).length
  if (props.books.length === 0) return null

  return (
    <div className="card">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-mahjong-hover transition-colors rounded-xl"
      >
        <span className="flex items-center gap-2">
          <UserCog className="w-4 h-4 text-mahjong-gold" />
          <span className="text-sm font-semibold text-slate-100">名前の表記ゆれ設定</span>
          {aliasCount > 0 && (
            <span className="text-xs bg-mahjong-gold/20 text-mahjong-gold px-2 py-0.5 rounded-full">{aliasCount}件設定済</span>
          )}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <AliasEditor {...props} />}
    </div>
  )
}
