import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeHeadToHead, headToHeadCumulative, compareBetter } from '../src/domain/headToHead.ts'
import { computeMonthlyRows, computeSessionSummaries } from '../src/domain/periodic.ts'
import { computeRollingRates } from '../src/domain/rolling.ts'
import { mergeBooks } from '../src/domain/merge.ts'
import { makeBook, makeGame, fourPlayers } from './helpers.ts'

const games = [
  makeGame('a', 1, '2026-01-10', fourPlayers(['A', 'B', 'C', 'D'])),
  makeGame('a', 2, '2026-01-10', fourPlayers(['B', 'C', 'A', 'D'])),
  makeGame('b', 1, '2026-02-01', fourPlayers(['A', 'C', 'D', 'E'])),
  makeGame('x', 1, undefined, fourPlayers(['B', 'A', 'C', 'D'])),
]

test('computeHeadToHead: 同卓した対局だけで勝敗を数える', () => {
  const h2h = computeHeadToHead('A', 'B', games)
  assert.equal(h2h.totalGames, 3)
  assert.equal(h2h.playerAWins, 1)
  assert.equal(h2h.playerBWins, 2)
  assert.equal(h2h.playerAFirstCount, 1)
  assert.deepEqual(headToHeadCumulative(h2h).map((p) => [p.a, p.b]), [[50, 10], [30, 60], [40, 110]])
})

test('computeHeadToHead: 同卓なし', () => {
  const h2h = computeHeadToHead('B', 'E', games)
  assert.equal(h2h.totalGames, 0)
  assert.equal(h2h.playerAWinRate, 0)
})

test('compareBetter: 同値は tie（以前は同値で片方が強調されていた）', () => {
  assert.equal(compareBetter(2.5, 2.5, false), 'tie')
  assert.equal(compareBetter(2.3, 2.5, false), 'a')
  assert.equal(compareBetter(10, 5, true), 'a')
  assert.equal(compareBetter(5, 10, true), 'b')
})

test('computeMonthlyRows: 月の古い順、日付不明は除外', () => {
  const rows = computeMonthlyRows(games)
  assert.deepEqual(rows.map((r) => r.month), ['2026-01', '2026-02'])
  assert.equal(rows[0].players.A.games, 2)
  assert.equal(rows[0].players.A.avgRank, 2)
  assert.equal(rows[1].players.E.games, 1)
  // B は2月に対局していない
  assert.equal(rows[1].players.B, undefined)
})

test('computeSessionSummaries: ブック単位に集計', () => {
  const data = mergeBooks([
    makeBook('a', '2026-01-10', games.slice(0, 2)),
    makeBook('b', '2026-02-01', games.slice(2, 3)),
  ])
  const sessions = computeSessionSummaries(data)
  assert.deepEqual(sessions.map((s) => [s.date, s.totalGames]), [['2026-01-10', 2], ['2026-02-01', 1]])
  assert.equal(sessions[0].players.A.totalScore, 30)
})

test('computeRollingRates: 窓幅ごとの率', () => {
  const ranks = [1, 2, 3, 4, 1]
  const points = computeRollingRates(ranks, ['d1', 'd2', 'd3', 'd4', 'd5'], 4)
  assert.equal(points.length, 2)
  assert.deepEqual(points[0], { gameNumber: 4, date: 'd4', firstRate: 25, top2Rate: 50, fourthRate: 25 })
  assert.equal(points[1].firstRate, 25)
  assert.deepEqual(computeRollingRates(ranks, [], 10), [])
})
