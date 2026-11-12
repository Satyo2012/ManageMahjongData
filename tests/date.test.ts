import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  compareDateAsc,
  extractDateFromFileName,
  isValidIsoDate,
  subtractMonths,
  todayIso,
} from '../src/domain/date.ts'

test('extractDateFromFileName: ファイル名の YYYYMMDD を取り出す', () => {
  assert.equal(extractDateFromFileName('麻雀集計表20261108.xlsx'), '2026-11-08')
  assert.equal(extractDateFromFileName('麻雀集計表20251123-0 - Google ドライブ.xlsx'), '2025-11-23')
})

test('extractDateFromFileName: 日付が無い・不正なら undefined', () => {
  assert.equal(extractDateFromFileName('麻雀集計表xxxxxxxx - Google ドライブ.xlsx'), undefined)
  assert.equal(extractDateFromFileName('麻雀集計表v1.02 のコピー.xlsx'), undefined)
  assert.equal(extractDateFromFileName('20261301.xlsx'), undefined)
  assert.equal(extractDateFromFileName('20250231.xlsx'), undefined)
})

test('isValidIsoDate: 実在する日付だけ true', () => {
  assert.equal(isValidIsoDate('2024-02-29'), true)
  assert.equal(isValidIsoDate('2023-02-29'), false)
  assert.equal(isValidIsoDate('2024/02/01'), false)
  assert.equal(isValidIsoDate(''), false)
})

test('compareDateAsc: 日付不明は最も古い扱い', () => {
  assert.ok(compareDateAsc(undefined, '2020-01-01') < 0)
  assert.ok(compareDateAsc('2020-01-01', undefined) > 0)
  assert.equal(compareDateAsc(undefined, undefined), 0)
  assert.ok(compareDateAsc('2026-01-01', '2026-01-02') < 0)
})

test('subtractMonths: 月末は丸め、年をまたぐ', () => {
  assert.equal(subtractMonths('2026-11-08', 1), '2026-10-08')
  assert.equal(subtractMonths('2026-03-31', 1), '2026-02-28')
  assert.equal(subtractMonths('2026-01-15', 1), '2025-12-15')
  assert.equal(subtractMonths('2026-11-08', 12), '2025-11-08')
})

test('todayIso: ローカル日付を YYYY-MM-DD で返す', () => {
  assert.equal(todayIso(new Date(2026, 0, 5, 23, 59)), '2026-01-05')
})
