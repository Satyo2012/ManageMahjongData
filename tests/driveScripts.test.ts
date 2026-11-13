import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync, createVerify } from 'node:crypto'
import * as XLSX from 'xlsx'
import { buildAssertion, parseServiceAccountKey, DRIVE_READONLY_SCOPE } from '../scripts/drive/googleAuth.ts'
import { formatReport, syncBooks } from '../scripts/drive/syncCore.ts'
import { parseXlsx } from '../scripts/drive/parseXlsx.ts'
import { XLSX_MIME, type DriveFile } from '../src/domain/driveSync.ts'
import { makeBook, makeGame, fourPlayers } from './helpers.ts'

test('buildAssertion: RS256 で署名され、必要なクレームを含む', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const key = { client_email: 'sync@example.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() }
  const jwt = buildAssertion(key, DRIVE_READONLY_SCOPE, 1_700_000_000)
  const [header, claims, signature] = jwt.split('.')

  assert.deepEqual(JSON.parse(Buffer.from(header, 'base64url').toString()), { alg: 'RS256', typ: 'JWT' })
  const c = JSON.parse(Buffer.from(claims, 'base64url').toString())
  assert.equal(c.iss, key.client_email)
  assert.equal(c.scope, DRIVE_READONLY_SCOPE)
  assert.equal(c.aud, 'https://oauth2.googleapis.com/token')
  assert.equal(c.exp - c.iat, 3600)
  const ok = createVerify('RSA-SHA256').update(`${header}.${claims}`).verify(publicKey, Buffer.from(signature, 'base64url'))
  assert.ok(ok)
})

test('parseServiceAccountKey: 壊れた JSON・項目不足はわかりやすいエラー', () => {
  assert.throws(() => parseServiceAccountKey('not json'), /JSON として読めません/)
  assert.throws(() => parseServiceAccountKey('{"client_email":"a"}'), /private_key/)
})

function xlsxBuffer(rows: unknown[][]): ArrayBuffer {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'S')
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}

test('parseXlsx: 実際の xlsx バイト列をアプリと同じロジックで解析する', () => {
  const buffer = xlsxBuffer([
    ['No', null, null, 'A', null, null, 'B', null, null, 'C', null, null, 'D'],
    [null, null, null, '順位', '素点', 'スコア', '順位', '素点', 'スコア', '順位', '素点', 'スコア', '順位', '素点', 'スコア'],
    [1, null, null, 1, 45000, 65, 2, 30000, 10, 3, 20000, -20, 4, 5000, -55],
  ])
  const book = parseXlsx(buffer, '麻雀集計表20261115.xlsx')
  assert.equal(book.date, '2026-11-15')
  assert.equal(book.games.length, 1)
  assert.ok(book.id)
})

const driveFile = (id: string, name: string): DriveFile => ({ id, name, mimeType: XLSX_MIME, modifiedTime: '2026-11-15T00:00:00.000Z' })

test('syncBooks: 追加・紐付け・エラーをまとめて報告し、失敗しても他は続ける', async () => {
  const legacy = makeBook('麻雀集計表20261108.xlsx', '2026-11-08', [])
  const result = await syncBooks([legacy], [driveFile('a', '麻雀集計表20261108'), driveFile('b', '麻雀集計表20261115.xlsx'), driveFile('c', '壊れた.xlsx')], {
    loadBook: async (file, fileName) => {
      if (file.id === 'c') throw new Error('対局データが見つかりませんでした')
      return makeBook(fileName, '2026-11-15', [makeGame(fileName, 1, '2026-11-15', fourPlayers(['A', 'B', 'C', 'D']))])
    },
  })
  assert.equal(result.changed, true)
  assert.equal(result.books.length, 2)
  assert.equal(result.books[0].driveFileId, 'a')
  assert.deepEqual(result.report.added, ['麻雀集計表20261115.xlsx（1局）'])
  assert.deepEqual(result.report.linked, ['麻雀集計表20261108'])
  assert.equal(result.report.errors[0].fileName, '壊れた.xlsx')
  assert.match(formatReport(result.report), /読み込みエラー（1件）/)
})

test('syncBooks: 変更が無ければ changed=false', async () => {
  const result = await syncBooks([], [], { loadBook: async () => assert.fail('呼ばれないはず') })
  assert.equal(result.changed, false)
  assert.match(formatReport(result.report), /変更はありませんでした/)
})
