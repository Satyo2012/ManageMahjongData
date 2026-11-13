import { randomUUID } from 'node:crypto'
import * as XLSX from 'xlsx'
import type { Book } from '../../src/types/index.ts'
import { parseSheetRows, SheetParseError, type Row } from '../../src/domain/sheetRows.ts'

/** xlsx のバイト列をブックにする（アプリの読み込みと同じ解析ロジックを使う） */
export function parseXlsx(buffer: ArrayBuffer, fileName: string): Book {
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) throw new SheetParseError('シートが見つかりません')
  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { header: 1, defval: null })
  return { id: randomUUID(), ...parseSheetRows(rows, fileName) }
}
