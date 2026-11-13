import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  bookFileName,
  bookKey,
  GOOGLE_SHEET_MIME,
  linkBook,
  planSync,
  upsertSyncedBook,
  XLSX_MIME,
  type DriveFile,
} from '../src/domain/driveSync.ts'
import { serializeSharedData } from '../src/domain/sharedDataFormat.ts'
import { makeBook, makeGame, fourPlayers } from './helpers.ts'

const file = (id: string, name: string, modifiedTime = '2026-11-01T00:00:00.000Z', mimeType: string = XLSX_MIME): DriveFile => ({
  id, name, mimeType, modifiedTime,
})
const game = (fileName: string, date?: string) => makeGame(fileName, 1, date, fourPlayers(['A', 'B', 'C', 'D']))
const legacy = makeBook('麻雀集計表20230625 - Google ドライブ.xlsx', '2023-06-25', [game('x', '2023-06-25')])

test('bookKey: 「 - Google ドライブ」と拡張子の有無を同一視する', () => {
  assert.equal(bookKey('麻雀集計表20230625 - Google ドライブ.xlsx'), '麻雀集計表20230625')
  assert.equal(bookKey('麻雀集計表20230625.xlsx'), '麻雀集計表20230625')
  assert.equal(bookKey('麻雀集計表20230625'), '麻雀集計表20230625')
  assert.notEqual(bookKey('麻雀集計表20251123-0'), bookKey('麻雀集計表20251123'))
})

test('bookFileName: スプレッドシートには .xlsx を付ける', () => {
  assert.equal(bookFileName(file('1', '麻雀集計表20261115', undefined, GOOGLE_SHEET_MIME)), '麻雀集計表20261115.xlsx')
  assert.equal(bookFileName(file('1', '麻雀集計表20261115.xlsx')), '麻雀集計表20261115.xlsx')
})

test('planSync: 新規は add、同名の手動登録ブックは link（読み込み直さない）', () => {
  const actions = planSync([legacy], [file('a', '麻雀集計表20230625'), file('b', '麻雀集計表20261115.xlsx')])
  assert.deepEqual(actions.map((a) => [a.kind, a.file.id]), [['link', 'a'], ['add', 'b']])
})

test('planSync: Excel・スプレッドシート以外は無視する', () => {
  assert.deepEqual(planSync([], [file('p', 'memo.pdf', undefined, 'application/pdf')]), [])
})

test('planSync: 紐付け済みは更新日時が新しいときだけ update', () => {
  const linked = linkBook([legacy], legacy, file('a', '麻雀集計表20230625', '2026-11-01T00:00:00.000Z'))
  assert.deepEqual(planSync(linked, [file('a', '麻雀集計表20230625', '2026-11-01T00:00:00.000Z')]), [])
  const actions = planSync(linked, [file('a', '麻雀集計表20230625', '2026-11-02T00:00:00.000Z')])
  assert.deepEqual(actions.map((a) => a.kind), ['update'])
})

test('planSync: 同名ファイルが作り直された（ID が変わった）場合も update', () => {
  const linked = linkBook([legacy], legacy, file('a', '麻雀集計表20230625'))
  assert.deepEqual(planSync(linked, [file('z', '麻雀集計表20230625')]).map((a) => a.kind), ['update'])
})

test('planSync: ドライブ内で名前が重複するファイルは取り込まない', () => {
  const actions = planSync([], [file('a', '麻雀集計表20261115.xlsx'), file('b', '麻雀集計表20261115')])
  assert.deepEqual(actions.map((a) => a.kind), ['duplicate', 'duplicate'])
})

test('upsertSyncedBook: 追加時はドライブ情報を記録', () => {
  const parsed = makeBook('麻雀集計表20261115.xlsx', '2026-11-15', [game('麻雀集計表20261115.xlsx', '2026-11-15')])
  const [book] = upsertSyncedBook([], parsed, file('b', '麻雀集計表20261115.xlsx', '2026-11-15T10:00:00.000Z'))
  assert.equal(book.driveFileId, 'b')
  assert.equal(book.driveModifiedTime, '2026-11-15T10:00:00.000Z')
})

test('upsertSyncedBook: 差し替え時、ファイル名に日付が無ければ手動設定の日付を引き継ぐ', () => {
  const manual = makeBook('麻雀集計表xxxxxxxx.xlsx', '2024-02-01', [game('麻雀集計表xxxxxxxx.xlsx', '2024-02-01')])
  const reparsed = makeBook('麻雀集計表xxxxxxxx.xlsx', undefined, [game('麻雀集計表xxxxxxxx.xlsx'), game('麻雀集計表xxxxxxxx.xlsx')])
  const books = upsertSyncedBook([manual], reparsed, file('m', '麻雀集計表xxxxxxxx.xlsx'), manual)
  assert.equal(books.length, 1)
  assert.equal(books[0].id, manual.id)
  assert.equal(books[0].date, '2024-02-01')
  assert.ok(books[0].games.every((g) => g.date === '2024-02-01'))
  assert.equal(books[0].games.length, 2)
})

test('serializeSharedData: 日付順・2スペース・末尾改行', () => {
  const newer = makeBook('b.xlsx', '2026-01-01', [])
  const older = makeBook('a.xlsx', '2025-01-01', [])
  const json = serializeSharedData([newer, older], {}, '2026-11-14')
  assert.ok(json.endsWith('}\n'))
  const parsed = JSON.parse(json)
  assert.deepEqual(parsed.books.map((b: { date: string }) => b.date), ['2025-01-01', '2026-01-01'])
  assert.equal(parsed.exportedAt, '2026-11-14')
})
