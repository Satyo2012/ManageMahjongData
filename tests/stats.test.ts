import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  computePlayerStats,
  isCompleteGame,
  listPlayersByGameCount,
  rankByTotalScore,
  computeStats,
} from '../src/domain/stats.ts'
import { makeGame, fourPlayers } from './helpers.ts'

const NAMES: [string, string, string, string] = ['A', 'B', 'C', 'D']

test('computePlayerStats: 着順率・累積スコアを計算する', () => {
  const games = [
    makeGame('f', 1, '2026-01-01', fourPlayers(NAMES)),
    makeGame('f', 2, '2026-01-01', fourPlayers(['B', 'A', 'C', 'D'])),
    makeGame('f', 3, '2026-01-02', fourPlayers(['C', 'D', 'B', 'A'])),
  ]
  const a = computePlayerStats('A', games)
  assert.equal(a.games, 3)
  assert.equal(a.firstCount, 1)
  assert.equal(a.secondCount, 1)
  assert.equal(a.fourthCount, 1)
  assert.equal(a.top2Rate, 66.7)
  assert.equal(a.avgRank, 2.333)
  assert.deepEqual(a.cumulativeScoreHistory, [50, 60, 20])
  assert.deepEqual(a.dateHistory, ['2026-01-01', '2026-01-01', '2026-01-02'])
})

test('computePlayerStats: 対局なしは全て 0', () => {
  const s = computePlayerStats('Z', [makeGame('f', 1, undefined, fourPlayers(NAMES))])
  assert.equal(s.games, 0)
  assert.equal(s.avgRank, 0)
  assert.deepEqual(s.scoreHistory, [])
})

test('computePlayerStats: 持ち点マイナスを飛びとして数える（0点は飛びではない）', () => {
  const game = makeGame('f', 1, undefined, fourPlayers(NAMES))
  game.players.D.points = -100
  game.players.C.points = 0
  assert.equal(computePlayerStats('D', [game]).flyingCount, 1)
  assert.equal(computePlayerStats('C', [game]).flyingCount, 0)
})

test('isCompleteGame: 4人分揃っていない行は不完全', () => {
  assert.equal(isCompleteGame(makeGame('f', 1, undefined, fourPlayers(NAMES))), true)
  assert.equal(isCompleteGame(makeGame('f', 13, undefined, [['中島さん', 2, 12.9]])), false)
})

test('listPlayersByGameCount: 対局数の多い順', () => {
  const games = [
    makeGame('f', 1, undefined, fourPlayers(NAMES)),
    makeGame('f', 2, undefined, fourPlayers(['A', 'B', 'C', 'E'])),
  ]
  assert.deepEqual(listPlayersByGameCount(games), ['A', 'B', 'C', 'D', 'E'])
})

test('rankByTotalScore: 合計スコアの高い順', () => {
  const games = [makeGame('f', 1, undefined, fourPlayers(['C', 'A', 'B', 'D']))]
  const ranking = rankByTotalScore(computeStats(['A', 'B', 'C', 'D'], games)).map((s) => s.name)
  assert.deepEqual(ranking, ['C', 'A', 'B', 'D'])
})
