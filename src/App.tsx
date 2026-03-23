import { useState, useCallback } from 'react'
import { parseExcelFile, mergeData } from './utils/excelParser'
import type { MahjongData } from './types'
import { FileUpload } from './components/FileUpload'
import { Dashboard } from './pages/Dashboard'
import { PlayerDetail } from './pages/PlayerDetail'
import { GamesPage } from './pages/GamesPage'
import { LayoutDashboard, List, Upload, Loader2 } from 'lucide-react'

type Tab = 'dashboard' | 'games' | 'upload'
type View = { tab: Tab; player?: string }

export default function App() {
  const [datasets, setDatasets] = useState<MahjongData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>({ tab: 'upload' })

  const merged = datasets.length > 0 ? mergeData(datasets) : null

  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) {
      setDatasets([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const results = await Promise.all(files.map(parseExcelFile))
      setDatasets(results)
      setView({ tab: 'dashboard' })
    } catch (e) {
      setError('Excelファイルの読み込みに失敗しました。形式を確認してください。')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  const hasData = merged !== null && merged.games.length > 0

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[#2d4a6a] bg-[#0f1923]/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🀄</span>
            <div>
              <h1 className="font-bold text-lg leading-tight text-[#d4af37]">麻雀成績管理</h1>
              {merged && (
                <p className="text-xs text-slate-500">{merged.games.length}局 / {merged.players.filter(p => merged.stats[p]?.games > 0).length}名</p>
              )}
            </div>
          </div>

          <nav className="flex gap-1 ml-auto">
            {hasData && (
              <>
                <button
                  onClick={() => setView({ tab: 'dashboard' })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    view.tab === 'dashboard' && !view.player
                      ? 'bg-[#d4af37] text-black font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-[#1e2d3d]'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">ダッシュボード</span>
                </button>
                <button
                  onClick={() => setView({ tab: 'games' })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    view.tab === 'games'
                      ? 'bg-[#d4af37] text-black font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-[#1e2d3d]'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">対局一覧</span>
                </button>
              </>
            )}
            <button
              onClick={() => setView({ tab: 'upload' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                view.tab === 'upload'
                  ? 'bg-[#d4af37] text-black font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-[#1e2d3d]'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">ファイル</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-[#d4af37]">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-lg">読み込み中...</span>
          </div>
        )}

        {!loading && error && (
          <div className="card border-red-800/60 bg-red-900/20 p-4 text-red-300 text-sm">
            ⚠️ {error}
          </div>
        )}

        {!loading && view.tab === 'upload' && (
          <div className="max-w-xl mx-auto py-8 space-y-6">
            <div className="text-center">
              <span className="text-6xl">🀄</span>
              <h2 className="text-2xl font-bold mt-4 text-[#d4af37]">麻雀成績管理システム</h2>
              <p className="text-slate-400 mt-2">
                麻雀集計表Excelファイルをアップロードしてください
              </p>
              <p className="text-slate-500 text-sm mt-1">複数ファイルを一括インポートできます</p>
            </div>
            <FileUpload onFiles={handleFiles} loading={loading} />
            {hasData && (
              <p className="text-center text-slate-500 text-sm">
                現在{datasets.length}ファイル読み込み済 —{' '}
                <button
                  onClick={() => setView({ tab: 'dashboard' })}
                  className="text-[#d4af37] hover:underline"
                >
                  ダッシュボードへ
                </button>
              </p>
            )}
          </div>
        )}

        {!loading && hasData && merged && view.tab === 'dashboard' && !view.player && (
          <Dashboard
            data={merged}
            onSelectPlayer={(name) => setView({ tab: 'dashboard', player: name })}
          />
        )}

        {!loading && hasData && merged && view.tab === 'dashboard' && view.player && (
          <PlayerDetail
            playerName={view.player}
            data={merged}
            onBack={() => setView({ tab: 'dashboard' })}
          />
        )}

        {!loading && hasData && merged && view.tab === 'games' && (
          <GamesPage data={merged} />
        )}
      </main>

      <footer className="border-t border-[#2d4a6a] py-3 text-center text-xs text-slate-600">
        麻雀成績管理 — Excelファイルはブラウザのみで処理されます（サーバー送信なし）
      </footer>
    </div>
  )
}
