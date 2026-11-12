import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import type { Book, NameAliasMap } from '../src/types/index.ts'
import { mergeBooks } from '../src/domain/merge.ts'
import { filterGamesByDateRange, getDateExtent } from '../src/domain/filter.ts'
import { sortGamesByDate } from '../src/domain/sort.ts'
import { subtractMonths } from '../src/domain/date.ts'
import { computeMonthlyRows } from '../src/domain/periodic.ts'

// Git 管理されている共有データ (public/data.json) で回帰チェックする
const shared = JSON.parse(readFileSync(new URL('../public/data.json', import.meta.url), 'utf8')) as {
  books: Book[]
  nameAliases: NameAliasMap
}
const data = mergeBooks(shared.books, shared.nameAliases)
const { maxDate } = getDateExtent(data.games)

test('実データ: 直近1ヶ月の集計に日付不明・期間外の対局が混ざらない', () => {
  assert.ok(maxDate)
  const start = subtractMonths(maxDate, 1)
  const recent = filterGamesByDateRange(data.games, { start, end: maxDate })
  assert.ok(recent.length > 0)
  assert.ok(recent.every((g) => g.date !== undefined && g.date >= start && g.date <= maxDate))
})

test('実データ: 新しい順の先頭は最新日の対局', () => {
  assert.equal(sortGamesByDate(data.games, 'desc')[0].date, maxDate)
})

test('実データ: 月次集計の最後の月は最新月（「不明」月が末尾に来ない）', () => {
  const rows = computeMonthlyRows(data.games)
  assert.equal(rows[rows.length - 1].month, maxDate?.slice(0, 7))
})

test('実データ: 全対局が4人分の結果を持つ', () => {
  assert.ok(data.games.every((g) => Object.keys(g.players).length === 4))
})
