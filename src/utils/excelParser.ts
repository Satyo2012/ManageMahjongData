import type { Book } from '../types'
import { parseSheetRows, SheetParseError, type Row } from '../domain/sheetRows'
import { generateId } from './storage'

async function readFirstSheet(file: File): Promise<Row[]> {
  // xlsx は大きい（数百KB）ので、閲覧だけの利用者には読み込ませない
  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) throw new SheetParseError('シートが見つかりません')
  return XLSX.utils.sheet_to_json<Row>(sheet, { header: 1, defval: null })
}

/** 麻雀集計表 Excel を読み込んでブックにする */
export async function parseExcelFile(file: File): Promise<Book> {
  const rows = await readFirstSheet(file)
  return { id: generateId(), ...parseSheetRows(rows, file.name) }
}

/** ユーザーに見せるエラーメッセージ */
export function describeParseError(error: unknown): string {
  if (error instanceof SheetParseError) return error.message
  return 'Excelファイルの読み込みに失敗しました。形式を確認してください。'
}
