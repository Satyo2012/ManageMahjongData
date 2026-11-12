import { useCallback, useMemo, useState } from 'react'

/** グラフに最初から表示する人数（多すぎると線が重なって読めないため） */
export const DEFAULT_VISIBLE_PLAYERS = 8

/**
 * グラフに表示するプレイヤーの選択状態。
 * players は対局数の多い順を想定し、初期状態は上位 defaultCount 人。
 */
export function useVisiblePlayers(players: string[], defaultCount = DEFAULT_VISIBLE_PLAYERS) {
  // null = 未操作（初期表示）
  const [selected, setSelected] = useState<Set<string> | null>(null)

  const visible = useMemo(() => {
    if (selected === null) return players.slice(0, defaultCount)
    return players.filter((p) => selected.has(p))
  }, [players, selected, defaultCount])

  const toggle = useCallback(
    (name: string) => {
      setSelected((prev) => {
        const next = new Set(prev ?? players.slice(0, defaultCount))
        if (next.has(name)) next.delete(name)
        else next.add(name)
        return next
      })
    },
    [players, defaultCount],
  )

  const showAll = useCallback(() => setSelected(new Set(players)), [players])
  const reset = useCallback(() => setSelected(null), [])

  return { visible, toggle, showAll, reset, isDefault: selected === null }
}
