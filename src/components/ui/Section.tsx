import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  icon: LucideIcon
  title: string
  note?: ReactNode
  actions?: ReactNode
  children: ReactNode
}

/** タイトル付きのカード */
export function Section({ icon: Icon, title, note, actions, children }: Props) {
  return (
    <section className="card p-5">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <h2 className="section-title">
          <Icon className="w-5 h-5 text-mahjong-gold" />
          {title}
        </h2>
        {note && <span className="text-xs text-slate-400">{note}</span>}
        {actions && <div className="ml-auto">{actions}</div>}
      </div>
      {children}
    </section>
  )
}
