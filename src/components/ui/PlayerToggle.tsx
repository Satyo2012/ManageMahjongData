import clsx from 'clsx'
import { usePlayerColor } from '../../theme/PlayerColorContext'

interface Props {
  players: string[]
  visible: string[]
  onToggle: (name: string) => void
  onShowAll: () => void
  onReset: () => void
  isDefault: boolean
}

/** グラフに表示するプレイヤーを選ぶチップ */
export function PlayerToggle({ players, visible, onToggle, onShowAll, onReset, isDefault }: Props) {
  const colorOf = usePlayerColor()
  const visibleSet = new Set(visible)

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-xs text-slate-400 mr-1">表示:</span>
      {players.map((name) => {
        const on = visibleSet.has(name)
        const color = colorOf(name)
        return (
          <button
            key={name}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(name)}
            className={clsx(
              'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border transition-colors',
              on ? 'text-white' : 'border-mahjong-border text-slate-500 hover:text-slate-300',
            )}
            style={on ? { backgroundColor: `${color}26`, borderColor: `${color}99` } : undefined}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: on ? color : '#4a6080' }} />
            {name}
          </button>
        )
      })}
      {visible.length < players.length && (
        <button type="button" onClick={onShowAll} className="text-xs text-mahjong-gold hover:underline ml-1">
          全員表示
        </button>
      )}
      {!isDefault && (
        <button type="button" onClick={onReset} className="text-xs text-slate-400 hover:text-white hover:underline ml-1">
          初期表示に戻す
        </button>
      )}
    </div>
  )
}
