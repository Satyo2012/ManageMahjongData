import { useState, useCallback, useEffect } from 'react'
import { parseExcelFile, mergeData, computeStats } from './utils/excelParser'
import {
  loadStoredBooks,
  saveBooks,
  addBook,
  removeBook,
  replaceBook,
  type StoredBook,
} from './utils/storage'
import type { MahjongData } from './types'
import { BookManager } from './components/BookManager'
import { Dashboard } from './pages/Dashboard'
import { PlayerDetail } from './pages/PlayerDetail'
import { GamesPage } from './pages/GamesPage'
import { HeadToHead } from './pages/HeadToHead'
import { LayoutDashboard, List, Upload, Loader2, Swords } from 'lucide-react'

type Tab = 'dashboard' | 'games' | 'h2h' | 'upload'
type View = { tab: Tab; player?: string }

function booksToMahjongData(books: StoredBook[]): MahjongData[] {
  return books.map((book) => {
    const stats = computeStats(book.players, book.games)
    return {
      id: book.id,
      games: book.games,
      players: book.players,
      stats,
      fileName: book.fileName,
      date: book.date,
    }
  })
}

export default function App() {
  const [books, setBooks] = useState<StoredBook[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>({ tab: 'upload' })

  // localStorage から初期ロード
  useEffect(() => {
    const stored = loadStoredBooks()
    setBooks(stored)
    if (stored.length > 0) {
      setView({ tab: 'dashboard' })
    }
  }, [])

  const datasets = booksToMahjongData(books)
  const merged = datasets.length > 0 ? mergeData(datasets) : null
  const hasData = merged !== null && merged.games.length > 0

  const handleAddBook = useCallback(
    async (file: File, overwrite: boolean) => {
      setLoading(true)
      setError(null)
      try {
        const result = await parseExcelFile(file)
        const newBook: StoredBook = {
          id: result.id,
          fileName: result.fileName,
          date: result.date,
          games: result.games,
          players: result.players,
        }

        setBooks((prev) => {
          let next: StoredBook[]
          if (overwrite) {
            next = replaceBook(prev, newBook)
          } else {
            next = addBook(prev, newBook)
          }
          saveBooks(next)
          return next
        })

        if (view.tab === 'upload') {
          setView({ tab: 'dashboard' })
        }
      } catch (e) {
        setError('Excelファイルの読み込みに失敗しました。形式を確認してください。')
        console.error(e)
      } finally {
        setLoading(false)
      }
    },
    [view.tab],
  )

  const handleRemoveBook = useCallback((id: string) => {
    setBooks((prev) => {
      const next = removeBook(prev, id)
      if (next.length === 0) {
        setView({ tab: 'upload' })
      }
      return next
    })
  }, [])

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
                <p className="text-xs text-slate-500">
                  {merged.games.length}局 / {merged.players.filter((p) => merged.stats[p]?.games > 0).length}名 /{' '}
                  {books.length}ブック
                </p>
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
                <button
                  onClick={() => setView({ tab: 'h2h' })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    view.tab === 'h2h'
                      ? 'bg-[#d4af37] text-black font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-[#1e2d3d]'
                  }`}
                >
                  <Swords className="w-4 h-4" />
                  <span className="hidden sm:inline">直対</span>
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
              <span className="hidden sm:inline">
                ファイル管理
                {books.length > 0 && (
                  <span className="ml-1.5 bg-[#2d4a6a] text-slate-300 text-xs px-1.5 py-0.5 rounded-full">
                    {books.length}
                  </span>
                )}
              </span>
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
          <div className="card border-red-800/60 bg-red-900/20 p-4 text-red-300 text-sm mb-4">
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
              <p className="text-slate-500 text-sm mt-1">
                データはブラウザに保存されるので、次回以降も継続して利用できます
              </p>
            </div>
            <BookManager
              books={books}
              onAddBook={handleAddBook}
              onRemoveBook={handleRemoveBook}
              loading={loading}
            />
            {hasData && (
              <p className="text-center text-slate-500 text-sm">
                現在{books.length}ブック / {merged?.games.length}局 読み込み済 —{' '}
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

        {!loading && hasData && merged && view.tab === 'h2h' && (
          <HeadToHead data={merged} />
        )}
      </main>

      <footer className="border-t border-[#2d4a6a] py-3 text-center text-xs text-slate-600">
        麻雀成績管理 — データはブラウザのlocalStorageに保存されます（サーバー送信なし）
      </footer>
    </div>
  )
}
