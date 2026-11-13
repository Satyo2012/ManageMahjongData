import type { Book } from '../../src/types/index.ts'
import { bookFileName, linkBook, planSync, upsertSyncedBook, type DriveFile } from '../../src/domain/driveSync.ts'

export interface SyncDeps {
  /** ファイルを読み込んでブックにする（失敗時は例外） */
  loadBook: (file: DriveFile, fileName: string) => Promise<Book>
}

export interface SyncReport {
  added: string[]
  updated: string[]
  linked: string[]
  duplicates: string[]
  errors: { fileName: string; message: string }[]
}

export interface SyncResult {
  books: Book[]
  report: SyncReport
  /** data.json を書き換える必要があるか */
  changed: boolean
}

/**
 * ドライブのファイル一覧を data.json のブックに反映する。
 * 1ファイルの読み込み失敗で全体を止めず、エラーとして報告する（次回の実行で再試行される）。
 */
export async function syncBooks(books: Book[], files: DriveFile[], deps: SyncDeps): Promise<SyncResult> {
  const report: SyncReport = { added: [], updated: [], linked: [], duplicates: [], errors: [] }
  let next = books

  for (const action of planSync(books, files)) {
    const fileName = bookFileName(action.file)
    if (action.kind === 'duplicate') {
      report.duplicates.push(action.file.name)
      continue
    }
    if (action.kind === 'link') {
      next = linkBook(next, action.book, action.file)
      report.linked.push(fileName)
      continue
    }
    try {
      const parsed = await deps.loadBook(action.file, fileName)
      if (action.kind === 'add') {
        next = upsertSyncedBook(next, parsed, action.file)
        report.added.push(`${fileName}（${parsed.games.length}局）`)
      } else {
        // planSync 後に linkBook で別オブジェクトになっている可能性があるので ID で引き直す
        const previous = next.find((b) => b.id === action.book.id)
        next = upsertSyncedBook(next, parsed, action.file, previous)
        report.updated.push(`${fileName}（${parsed.games.length}局）`)
      }
    } catch (e) {
      report.errors.push({ fileName, message: e instanceof Error ? e.message : String(e) })
    }
  }

  const changed = report.added.length + report.updated.length + report.linked.length > 0
  return { books: next, report, changed }
}

/** GitHub Actions のサマリー等に出す Markdown */
export function formatReport(report: SyncReport): string {
  const section = (title: string, items: string[]) =>
    items.length > 0 ? [`### ${title}（${items.length}件）`, ...items.map((i) => `- ${i}`), ''] : []
  const lines = [
    '## Google ドライブ同期の結果',
    '',
    ...section('追加', report.added),
    ...section('更新（ドライブ側で変更あり）', report.updated),
    ...section('既存ブックと紐付け', report.linked),
    ...section('名前が重複していて取り込めなかったファイル', report.duplicates),
    ...section('読み込みエラー', report.errors.map((e) => `${e.fileName}: ${e.message}`)),
  ]
  if (lines.length === 2) lines.push('変更はありませんでした。')
  return lines.join('\n') + '\n'
}
