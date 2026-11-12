import { useCallback, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useBookStore } from './hooks/useBookStore'
import { buildMahjongData, mergeBooks } from './domain/merge'
import { ALL_TIME, countUndatedGames, filterGamesByDateRange, getDateExtent, isRangeActive, type DateRange } from './domain/filter'
import { buildPlayerColorMap } from './theme/playerColors'
import { PlayerColorContext } from './theme/PlayerColorContext'
import { AppHeader, type Tab } from './components/AppHeader'
import { DateRangeFilter } from './components/DateRangeFilter'
import { Dashboard } from './pages/Dashboard'
import { PlayerDetail } from './pages/PlayerDetail'
import { GamesPage } from './pages/GamesPage'
import { HeadToHead } from './pages/HeadToHead'
import { MonthlyStats } from './pages/MonthlyStats'
import { UploadPage } from './pages/UploadPage'

interface View {
  tab: Tab
  player?: string
}

export default function App() {
  const store = useBookStore()
  const [view, setView] = useState<View>({ tab: 'dashboard' })
  const [range, setRange] = useState<DateRange>(ALL_TIME)

  const merged = useMemo(() => mergeBooks(store.books, store.aliases), [store.books, store.aliases])
  // 色は全期間の対局数順で決める（期間を変えても同じ人は同じ色）
  const colorMap = useMemo(() => buildPlayerColorMap(merged.players), [merged.players])
  const filtered = useMemo(
    () => (isRangeActive(range) ? buildMahjongData(filterGamesByDateRange(merged.games, range)) : merged),
    [merged, range],
  )
  const extent = useMemo(() => getDateExtent(merged.games), [merged.games])
  const undatedCount = useMemo(() => countUndatedGames(merged.games), [merged.games])

  const navigate = useCallback((next: View) => {
    setView(next)
    window.scrollTo({ top: 0 })
  }, [])
  const selectPlayer = useCallback((player: string) => navigate({ tab: 'dashboard', player }), [navigate])

  if (store.initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-3 text-mahjong-gold">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-lg">読み込み中...</span>
      </div>
    )
  }

  const hasData = merged.games.length > 0
  const activeTab: Tab = hasData ? view.tab : 'upload'
  const summary = hasData
    ? `${merged.games.length}局 / ${merged.players.length}名 / ${merged.bookBoundaries.length}セッション${extent.maxDate ? ` · 最新 ${extent.maxDate}` : ''}`
    : undefined

  return (
    <PlayerColorContext.Provider value={colorMap}>
      <div className="min-h-screen flex flex-col">
        <AppHeader
          activeTab={view.player ? 'dashboard' : activeTab}
          hasData={hasData}
          summary={summary}
          source={store.source}
          bookCount={store.books.length}
          onNavigate={(tab) => navigate({ tab })}
        />

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-6">
          {activeTab !== 'upload' && (
            <DateRangeFilter
              range={range}
              onChange={setRange}
              minDate={extent.minDate}
              maxDate={extent.maxDate}
              filteredCount={filtered.games.length}
              undatedCount={undatedCount}
            />
          )}

          {activeTab === 'dashboard' && !view.player && <Dashboard data={filtered} onSelectPlayer={selectPlayer} />}
          {activeTab === 'dashboard' && view.player && (
            <PlayerDetail playerName={view.player} data={filtered} onBack={() => navigate({ tab: 'dashboard' })} />
          )}
          {activeTab === 'games' && <GamesPage data={filtered} />}
          {activeTab === 'h2h' && <HeadToHead data={filtered} />}
          {activeTab === 'monthly' && <MonthlyStats data={filtered} />}
          {activeTab === 'upload' && (
            <UploadPage store={store} onGoDashboard={hasData ? () => navigate({ tab: 'dashboard' }) : undefined} />
          )}
        </main>

        <footer className="border-t border-mahjong-border py-3 text-center text-xs text-slate-400">
          麻雀成績管理 — 共有データは Git 管理の public/data.json から読み込み、ファイル管理での変更はこのブラウザに保存されます
        </footer>
      </div>
    </PlayerColorContext.Provider>
  )
}
