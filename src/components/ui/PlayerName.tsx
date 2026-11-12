import clsx from 'clsx'
import { usePlayerColor } from '../../theme/PlayerColorContext'

interface Props {
  name: string
  className?: string
}

/** 色付きドット + 名前（グラフの線の色と対応） */
export function PlayerName({ name, className }: Props) {
  const colorOf = usePlayerColor()
  return (
    <span className={clsx('inline-flex items-center gap-1.5 min-w-0', className)}>
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colorOf(name) }} />
      <span className="truncate">{name}</span>
    </span>
  )
}
