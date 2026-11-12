import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mergeBooks, computeBookBoundaries } from '../src/domain/merge.ts'
import { filterGamesByDateRange, countUndatedGames, getDateExtent } from '../src/domain/filter.ts'
import { sortGamesByDate } from '../src/domain/sort.ts'
import { setBookDate, replaceBook, sortBooksByDate } from '../src/domain/books.ts'
import { makeBook, makeGame, fourPlayers } from './helpers.ts'

const recent = makeBook('20261108.xlsx', '2026-11-08', [
  makeGame('20261108.xlsx', 1, '2026-11-08', fourPlayers(['志村さん', '中島さん', '野本さん', '直江さん'])),
  makeGame('20261108.xlsx', 2, '2026-11-08', fourPlayers(['中島さん', '志村さん', '野本さん', '直江さん'])),
])
const older = makeBook('20231105.xlsx', '2023-11-05', [
  makeGame('20231105.xlsx', 1, '2023-11-05', fourPlayers(['細井さん', '志村さん', '野本さん', '須山さん'])),
])
const undated = makeBook('xxxxxxxx.xlsx', undefined, [
  makeGame('xxxxxxxx.xlsx', 1, undefined, fourPlayers(['細井さん', '菊田さん', '志村さん', '直江さん'])),
  makeGame('xxxxxxxx.xlsx', 2, undefined, fourPlayers(['細井さん', '菊田さん', '志村さん', '直江さん'])),
])

test('mergeBooks: 日付順に並べ、日付不明は先頭（最古扱い）', () => {
  const data = mergeBooks([recent, undated, older])
  assert.deepEqual(
    data.games.map((g) => g.date),
    [undefined, undefined, '2023-11-05', '2026-11-08', '2026-11-08'],
  )
  assert.deepEqual(
    data.bookBoundaries.map((b) => [b.startIndex, b.gameCount]),
    [[0, 2], [2, 1], [3, 2]],
  )
})

test('mergeBooks: 4人揃っていない対局を除外する', () => {
  const broken = makeBook('20250727.xlsx', '2025-07-27', [
    makeGame('20250727.xlsx', 12, '2025-07-27', fourPlayers(['中島さん', '菊田さん', '志村さん', '直江さん'])),
    makeGame('20250727.xlsx', 13, '2025-07-27', [['中島さん', 2, 12.9]]),
  ])
  const data = mergeBooks([broken])
  assert.equal(data.games.length, 1)
  assert.equal(data.stats['中島さん'].games, 1)
})

test('mergeBooks: エイリアスで名前を統合する', () => {
  const data = mergeBooks([older], { 細井さん: '細井' })
  assert.ok(data.stats['細井'])
  assert.equal(data.stats['細井さん'], undefined)
})

test('filterGamesByDateRange: 期間指定時は日付不明の対局を含めない（細井さん混入バグの回帰テスト）', () => {
  const { games } = mergeBooks([recent, older, undated])
  const lastMonth = filterGamesByDateRange(games, { start: '2026-10-08', end: '2026-11-08' })
  assert.equal(lastMonth.length, 2)
  assert.ok(lastMonth.every((g) => !g.players['細井さん']))
})

test('filterGamesByDateRange: 両端を含み、未指定なら全件', () => {
  const { games } = mergeBooks([recent, older, undated])
  assert.equal(filterGamesByDateRange(games, { start: '', end: '' }).length, 5)
  assert.equal(filterGamesByDateRange(games, { start: '2023-11-05', end: '2023-11-05' }).length, 1)
  assert.equal(filterGamesByDateRange(games, { start: '', end: '2023-12-31' }).length, 1)
  assert.equal(countUndatedGames(games), 2)
  assert.deepEqual(getDateExtent(games), { minDate: '2023-11-05', maxDate: '2026-11-08' })
})

test('sortGamesByDate: desc は新しい順で日付不明が末尾、同日は対局No降順', () => {
  const { games } = mergeBooks([older, undated, recent])
  const desc = sortGamesByDate(games, 'desc')
  assert.deepEqual(desc.map((g) => [g.date, g.gameNo]), [
    ['2026-11-08', 2],
    ['2026-11-08', 1],
    ['2023-11-05', 1],
    [undefined, 2],
    [undefined, 1],
  ])
})

test('sortGamesByDate: 日付不明が複数ブックでも交互に混ざらない', () => {
  const other = makeBook('v1.02.xlsx', undefined, [
    makeGame('v1.02.xlsx', 1, undefined, fourPlayers(['前田さん', '遠藤さん', '志村さん', '細井さん'])),
  ])
  const asc = sortGamesByDate([...undated.games, ...other.games], 'asc')
  assert.deepEqual(asc.map((g) => g.fileName), ['v1.02.xlsx', 'xxxxxxxx.xlsx', 'xxxxxxxx.xlsx'])
})

test('setBookDate: ブックと各対局の日付を更新し、並び順に反映される', () => {
  const books = setBookDate([recent, undated], undated.id, '2024-01-01')
  const data = mergeBooks(books)
  assert.deepEqual(data.games.map((g) => g.date), ['2024-01-01', '2024-01-01', '2026-11-08', '2026-11-08'])
  assert.equal(countUndatedGames(data.games), 0)
})

test('replaceBook / sortBooksByDate', () => {
  const updated = { ...recent, id: 'new' }
  assert.equal(replaceBook([recent, older], updated)[0].id, 'new')
  assert.equal(replaceBook([older], updated).length, 2)
  assert.deepEqual(sortBooksByDate([recent, undated, older], 'desc').map((b) => b.date), ['2026-11-08', '2023-11-05', undefined])
})

test('computeBookBoundaries: 空配列', () => {
  assert.deepEqual(computeBookBoundaries([]), [])
})
