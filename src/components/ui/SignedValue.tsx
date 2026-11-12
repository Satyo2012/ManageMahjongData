import clsx from 'clsx'
import { formatSigned, scoreTextClass } from '../../utils/format'

interface Props {
  value: number
  digits?: number
  className?: string
}

/** +12.3 / -4.5 を正負の色付きで表示 */
export function SignedValue({ value, digits = 1, className }: Props) {
  return <span className={clsx('font-mono tabular-nums', scoreTextClass(value), className)}>{formatSigned(value, digits)}</span>
}
