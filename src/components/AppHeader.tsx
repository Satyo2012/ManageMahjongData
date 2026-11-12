import clsx from 'clsx'
import type { ReactNode } from 'react'
import { BarChart2, CloudOff, LayoutDashboard, List, PencilLine, Share2, Swords, Upload } from 'lucide-react'
import type { DataSource } from '../hooks/useBookStore'

export type Tab = 'dashboard' | 'games' | 'h2h' | 'monthly' | 'upload'

interface Props {
  activeTab: Tab
  hasData: boolean
  summary?: string
  source: DataSource
  bookCount: number
  onNavigate: (tab: Tab) => void
}

const DATA_TABS: { tab: Tab; label: string; icon: ReactNode }[] = [
  { tab: 'dashboard', label: 'ダッシュボード', icon: <LayoutDashboard className="w-4 h-4" /> },
  { tab: 'games', label: '対局一覧', icon: <List className="w-4 h-4" /> },
  { tab: 'h2h', label: '直対', icon: <Swords className="w-4 h-4" /> },
  { tab: 'monthly', label: '月次', icon: <BarChart2 className="w-4 h-4" /> },
]

const SOURCE_BADGE: Record<DataSource, { label: string; cls: string; icon: ReactNode }> = {
  shared: { label: '共有データ', cls: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-300', icon: <Share2 className="w-3 h-3" /> },
  draft: { label: '未共有の変更あり', cls: 'bg-amber-900/40 border-amber-700/60 text-amber-300', icon: <PencilLine className="w-3 h-3" /> },
  local: { label: 'ローカル保存', cls: 'bg-slate-800 border-slate-600 text-slate-300', icon: <CloudOff className="w-3 h-3" /> },
}

function NavButton({ active, label, icon, badge, onClick }: { active: boolean; label: string; icon: ReactNode; badge?: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      title={label}
      className={clsx(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
        active ? 'bg-mahjong-gold text-black font-bold' : 'text-slate-300 hover:text-white hover:bg-mahjong-hover',
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={clsx('text-xs px-1.5 rounded-full', active ? 'bg-black/20' : 'bg-mahjong-border text-slate-200')}>{badge}</span>
      )}
    </button>
  )
}

export function AppHeader({ activeTab, hasData, summary, source, bookCount, onNavigate }: Props) {
  const badge = SOURCE_BADGE[source]
  return (
    <header className="border-b border-mahjong-border bg-mahjong-dark/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-x-4 gap-y-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl" aria-hidden>🀄</span>
          <div className="min-w-0">
            <h1 className="font-bold text-lg leading-tight text-mahjong-gold">麻雀成績管理</h1>
            {summary && <p className="text-xs text-slate-400 truncate">{summary}</p>}
          </div>
          <span className={clsx('hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs whitespace-nowrap', badge.cls)}>
            {badge.icon}
            {badge.label}
          </span>
        </div>

        <nav className="flex gap-1 ml-auto flex-wrap justify-end" aria-label="メインメニュー">
          {hasData &&
            DATA_TABS.map(({ tab, label, icon }) => (
              <NavButton key={tab} active={activeTab === tab} label={label} icon={icon} onClick={() => onNavigate(tab)} />
            ))}
          <NavButton
            active={activeTab === 'upload'}
            label="ファイル管理"
            icon={<Upload className="w-4 h-4" />}
            badge={bookCount}
            onClick={() => onNavigate('upload')}
          />
        </nav>
      </div>
    </header>
  )
}
