import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface Props {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null
  const buttons = [
    { icon: ChevronsLeft, label: '最初のページ', target: 1, disabled: page === 1 },
    { icon: ChevronLeft, label: '前のページ', target: page - 1, disabled: page === 1 },
  ]
  const nextButtons = [
    { icon: ChevronRight, label: '次のページ', target: page + 1, disabled: page === totalPages },
    { icon: ChevronsRight, label: '最後のページ', target: totalPages, disabled: page === totalPages },
  ]
  const render = (list: typeof buttons) =>
    list.map(({ icon: Icon, label, target, disabled }) => (
      <button key={label} type="button" aria-label={label} title={label} disabled={disabled} onClick={() => onChange(target)} className="btn-ghost px-2">
        <Icon className="w-4 h-4" />
      </button>
    ))

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="ページ送り">
      {render(buttons)}
      <span className="text-sm text-slate-300 px-2 tabular-nums">
        {page} / {totalPages}
      </span>
      {render(nextButtons)}
    </nav>
  )
}
