import { createContext, useCallback, useContext } from 'react'
import { FALLBACK_PLAYER_COLOR, type PlayerColorMap } from './playerColors'

export const PlayerColorContext = createContext<PlayerColorMap>({})

/** プレイヤー名 → 表示色 */
export function usePlayerColor(): (name: string) => string {
  const map = useContext(PlayerColorContext)
  return useCallback((name: string) => map[name] ?? FALLBACK_PLAYER_COLOR, [map])
}
