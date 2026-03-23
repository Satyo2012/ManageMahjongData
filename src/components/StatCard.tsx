interface Props {
  label: string
  value: string | number
  sub?: string
  color?: 'gold' | 'green' | 'red' | 'blue' | 'default'
}

const COLOR_MAP = {
  gold: 'text-yellow-400',
  green: 'text-emerald-400',
  red: 'text-red-400',
  blue: 'text-blue-400',
  default: 'text-white',
}

export function StatCard({ label, value, sub, color = 'default' }: Props) {
  return (
    <div className="card p-4 flex flex-col gap-1">
      <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold ${COLOR_MAP[color]}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  )
}
