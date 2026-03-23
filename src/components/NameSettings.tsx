import { useState, useEffect, useMemo } from 'react'
import { UserCog, Save, RotateCcw, ChevronDown, ChevronUp, Merge } from 'lucide-react'
import type { NameAliasMap } from '../types'
import type { StoredBook } from '../utils/storage'

interface Props {
  books: StoredBook[]
  aliases: NameAliasMap
  onSave: (aliases: NameAliasMap) => void
}

export function NameSettings({ books, aliases, onSave }: Props) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<NameAliasMap>({})
  const [saved, setSaved] = useState(false)

  // 全ブックから重複なしの生の名前一覧
  const rawNames = useMemo(() => {
    const all = books.flatMap((b) => b.players)
    return [...new Set(all)].sort()
  }, [books])

  // パネルを開いたとき draft を現在の aliases で初期化
  useEffect(() => {
    if (open) {
      setDraft({ ...aliases })
      setSaved(false)
    }
  }, [open, aliases])

  if (rawNames.length === 0) return null

  const handleChange = (raw: string, value: string) => {
    setDraft((prev) => {
      const next = { ...prev }
      if (value.trim() === '' || value.trim() === raw) {
        delete next[raw]  // identity mapping は不要なので削除
      } else {
        next[raw] = value.trim()
      }
      return next
    })
    setSaved(false)
  }

  const handleSave = () => {
    onSave(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setDraft({})
    setSaved(false)
  }

  // 正規化後にどの名前がどれと統合されるかを計算
  const mergeGroups = useMemo(() => {
    const groups: Record<string, string[]> = {}
    for (const raw of rawNames) {
      const canonical = draft[raw] ?? raw
      if (!groups[canonical]) groups[canonical] = []
      groups[canonical].push(raw)
    }
    return groups
  }, [rawNames, draft])

  const hasMerges = Object.values(mergeGroups).some((g) => g.length > 1)

  return (
    <div className="card border-[#2d4a6a]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-[#243447] transition-colors rounded-xl"
      >
        <div className="flex items-center gap-2">
          <UserCog className="w-4 h-4 text-[#d4af37]" />
          <span className="text-sm font-semibold text-slate-200">名前の表記ゆれ設定</span>
          {Object.keys(aliases).length > 0 && (
            <span className="text-xs bg-[#d4af37]/20 text-[#d4af37] px-2 py-0.5 rounded-full">
              {Object.keys(aliases).length}件設定済
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-[#2d4a6a] pt-4">
          <p className="text-xs text-slate-400">
            複数ブックで表記が異なる名前を統合できます。「正規化後の名前」を同じにすると同一プレイヤーとして集計されます。
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs border-b border-[#2d4a6a]">
                  <th className="text-left py-2 pr-4">検出された名前</th>
                  <th className="text-left py-2 pr-4">登場ブック</th>
                  <th className="text-left py-2">正規化後の名前</th>
                </tr>
              </thead>
              <tbody>
                {rawNames.map((raw) => {
                  const appearsIn = books.filter((b) => b.players.includes(raw)).map((b) => b.date ?? b.fileName)
                  const current = draft[raw] ?? raw
                  const isChanged = current !== raw

                  return (
                    <tr key={raw} className="border-b border-[#1e2d3d]">
                      <td className="py-2 pr-4 text-slate-200 font-medium whitespace-nowrap">{raw}</td>
                      <td className="py-2 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {appearsIn.map((label) => (
                            <span
                              key={label}
                              className="text-xs bg-[#162535] text-slate-400 px-1.5 py-0.5 rounded"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2">
                        <input
                          type="text"
                          value={current}
                          onChange={(e) => handleChange(raw, e.target.value)}
                          className={`w-full bg-[#162535] border rounded px-2 py-1 text-sm focus:outline-none transition-colors ${
                            isChanged
                              ? 'border-[#d4af37]/60 text-[#d4af37] focus:border-[#d4af37]'
                              : 'border-[#2d4a6a] text-slate-300 focus:border-[#d4af37]/50'
                          }`}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* 統合プレビュー */}
          {hasMerges && (
            <div className="bg-[#162535] rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                <Merge className="w-3.5 h-3.5 text-emerald-400" />
                統合プレビュー
              </div>
              {Object.entries(mergeGroups)
                .filter(([, members]) => members.length > 1)
                .map(([canonical, members]) => (
                  <div key={canonical} className="text-xs text-slate-300">
                    <span className="text-emerald-400 font-bold">{canonical}</span>
                    <span className="text-slate-500"> ← </span>
                    {members.map((m, i) => (
                      <span key={m}>
                        <span className={m === canonical ? 'text-slate-400' : 'text-amber-400'}>{m}</span>
                        {i < members.length - 1 && <span className="text-slate-600"> + </span>}
                      </span>
                    ))}
                  </div>
                ))}
            </div>
          )}

          {/* 操作ボタン */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                saved
                  ? 'bg-emerald-700 text-white'
                  : 'bg-[#d4af37] text-black font-bold hover:bg-[#e6c348]'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              {saved ? '保存しました' : '保存して適用'}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm card hover:border-slate-500 text-slate-400 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              リセット
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
