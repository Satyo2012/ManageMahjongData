import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseSheetRows, SheetParseError, type Row } from '../src/domain/sheetRows.ts'

/** 新テンプレート: 3列目からプレイヤー列。末尾に集計列 */
function newTemplate(dataRows: Row[]): Row[] {
  return [
    ['No', 'メモ', null, 'A', null, null, 'B', null, null, 'C', null, null, 'D', null, null, 'E', null, null, '持ち点合計'],
    [null, null, null, '順位', '素点', 'スコア', '順位', '素点', 'スコア', '順位', '素点', 'スコア', '順位', '素点', 'スコア', '順位', '素点', 'スコア', '合計'],
    ...dataRows,
  ]
}

const fullRow: Row = [1, null, null, 1, 45000, 65, 2, 30000, 10, 3, 20000, -20, 4, 5000, -55, null, null, null, 0]

test('parseSheetRows: 新テンプレートを読み、未参加プレイヤーと集計列を除外する', () => {
  const book = parseSheetRows(newTemplate([fullRow]), '麻雀集計表20261108.xlsx')
  assert.equal(book.date, '2026-11-08')
  assert.deepEqual(book.players, ['A', 'B', 'C', 'D'])
  assert.deepEqual(book.games[0].players.D, { rank: 4, points: 5000, score: -55 })
})

test('parseSheetRows: 旧テンプレート（2列目から）にも対応', () => {
  const rows: Row[] = [
    ['No', null, 'A', null, null, 'B', null, null, 'C', null, null, 'D', null, null],
    [null, null, '順位', '素点', 'スコア', '順位', '素点', 'スコア', '順位', '素点', 'スコア', '順位', '素点', 'スコア'],
    [1, null, 2, 30000, 10, 1, 45000, 65, 4, 5000, -55, 3, 20000, -20],
  ]
  const book = parseSheetRows(rows, 'old.xlsx')
  assert.equal(book.date, undefined)
  assert.equal(book.games[0].players.B.rank, 1)
})

test('parseSheetRows: 入力途中の行・小計行・数値でないセルを除外', () => {
  const partial: Row = [2, null, null, 2, 32900, 12.9, null, null, null, null, null, null, null, null, null]
  const subtotal: Row = [3, '-', null, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4]
  const textCell: Row = [4, null, null, 1, 'abc', 65, 2, 30000, 10, 3, 20000, -20, 4, 5000, -55]
  const book = parseSheetRows(newTemplate([fullRow, partial, subtotal, textCell]), 'x.xlsx')
  assert.equal(book.games.length, 1)
})

test('parseSheetRows: 対局が無ければエラー', () => {
  assert.throws(() => parseSheetRows(newTemplate([]), '麻雀集計表20251019.xlsx'), SheetParseError)
})
