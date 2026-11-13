import type { Book } from '../types/index.ts'

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
export const GOOGLE_SHEET_MIME = 'application/vnd.google-apps.spreadsheet'

/** Google ドライブ上のファイル（一覧 API の結果） */
export interface DriveFile {
  id: string
  name: string
  mimeType: string
  /** RFC 3339 (例: 2026-11-08T12:34:56.000Z) */
  modifiedTime: string
}

export type SyncAction =
  /** data.json に無いファイル → 読み込んで追加 */
  | { kind: 'add'; file: DriveFile }
  /** ドライブ側で更新されたファイル → 読み込み直して差し替え */
  | { kind: 'update'; file: DriveFile; book: Book }
  /** 同名の既存ブックにドライブのファイル ID を記録するだけ（読み込み直さない） */
  | { kind: 'link'; file: DriveFile; book: Book }
  /** ドライブ内に同じ名前のファイルが複数ある → 取り込まない */
  | { kind: 'duplicate'; file: DriveFile }

export function isSpreadsheet(file: DriveFile): boolean {
  return file.mimeType === XLSX_MIME || file.mimeType === GOOGLE_SHEET_MIME
}

/**
 * ファイル名の照合キー。ブラウザからダウンロードすると「 - Google ドライブ.xlsx」が付くため、
 * それと拡張子を除いて比較する（例: 「麻雀集計表20230625 - Google ドライブ.xlsx」=「麻雀集計表20230625」）。
 */
export function bookKey(fileName: string): string {
  return fileName
    .normalize('NFKC')
    .replace(/\.xlsx$/i, '')
    .replace(/\s*-\s*Google ドライブ$/, '')
    .trim()
}

/** 取り込み後のブック名。Google スプレッドシートは xlsx として書き出すので拡張子を付ける */
export function bookFileName(file: DriveFile): string {
  return file.mimeType === GOOGLE_SHEET_MIME && !/\.xlsx$/i.test(file.name) ? `${file.name}.xlsx` : file.name
}

/** ドライブのファイル一覧と既存ブックを突き合わせ、必要な操作を決める。変更不要なファイルは含まない */
export function planSync(books: Book[], files: DriveFile[]): SyncAction[] {
  const byId = new Map(books.filter((b) => b.driveFileId).map((b) => [b.driveFileId, b]))
  const byKey = new Map(books.map((b) => [bookKey(b.fileName), b]))
  const keyCount = new Map<string, number>()
  for (const f of files.filter(isSpreadsheet)) keyCount.set(bookKey(f.name), (keyCount.get(bookKey(f.name)) ?? 0) + 1)

  const actions: SyncAction[] = []
  for (const file of files.filter(isSpreadsheet)) {
    const linked = byId.get(file.id)
    if (linked) {
      // 一度取り込んだファイルは ID で追跡し、更新日時が新しくなったら読み込み直す
      if (!linked.driveModifiedTime || file.modifiedTime > linked.driveModifiedTime) {
        actions.push({ kind: 'update', file, book: linked })
      }
      continue
    }
    if ((keyCount.get(bookKey(file.name)) ?? 0) > 1) {
      actions.push({ kind: 'duplicate', file })
      continue
    }
    const sameName = byKey.get(bookKey(file.name))
    if (!sameName) {
      actions.push({ kind: 'add', file })
    } else if (!sameName.driveFileId) {
      // 手作業で登録済みのブック。日付修正などを消さないよう、初回は紐付けだけ行う
      actions.push({ kind: 'link', file, book: sameName })
    } else {
      // 同名ファイルがドライブ上で作り直された（ID が変わった）→ 新しい方で差し替える
      actions.push({ kind: 'update', file, book: sameName })
    }
  }
  return actions
}

export function linkBook(books: Book[], book: Book, file: DriveFile): Book[] {
  return books.map((b) => (b === book ? { ...b, driveFileId: file.id, driveModifiedTime: file.modifiedTime } : b))
}

/**
 * 読み込んだブックを追加・差し替えする。
 * ファイル名に日付が無い場合は、アプリで手動設定した既存の日付を引き継ぐ。
 */
export function upsertSyncedBook(books: Book[], parsed: Book, file: DriveFile, previous?: Book): Book[] {
  const date = parsed.date ?? previous?.date
  const synced: Book = {
    ...parsed,
    date,
    games: parsed.games.map((g) => ({ ...g, date })),
    driveFileId: file.id,
    driveModifiedTime: file.modifiedTime,
  }
  if (!previous) return [...books, synced]
  return books.map((b) => (b === previous ? { ...synced, id: previous.id } : b))
}
