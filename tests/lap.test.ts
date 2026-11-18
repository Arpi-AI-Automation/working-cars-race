import assert from 'node:assert/strict'
import { test } from 'node:test'

import { crossGate, formatTime, freshLap } from '../src/lap.ts'

test('practice lap records a time and does not finish the session', () => {
  let state = freshLap()
  state = crossGate(state, 'start', 1_000, null).state
  assert.equal(state.armed, true)
  state = crossGate(state, 'checkpoint', 5_000, null).state
  const done = crossGate(state, 'finish', 11_000, null)
  assert.equal(done.state.lap, 1)
  assert.equal(done.state.lastLapMs, 10_000)
  assert.equal(done.state.bestLapMs, 10_000)
  assert.equal(done.state.finished, false)
  assert.equal(done.state.armed, false)
  assert.equal(done.message, 'ラップ！')
})

test('a finish without the checkpoint does not count', () => {
  let state = freshLap()
  state = crossGate(state, 'start', 0, 2).state
  const done = crossGate(state, 'finish', 4_000, 2)
  assert.equal(done.state.lap, 0)
  assert.equal(done.state.finished, false)
})

test('race finishes on the target lap and ignores later gates', () => {
  let state = freshLap()
  const lap = (from: number) => {
    state = crossGate(state, 'start', from, 2).state
    state = crossGate(state, 'checkpoint', from + 100, 2).state
    state = crossGate(state, 'finish', from + 200, 2).state
  }
  lap(0)
  assert.equal(state.lap, 1)
  assert.equal(state.finished, false)
  lap(1_000)
  assert.equal(state.lap, 2)
  assert.equal(state.finished, true)
  assert.equal(state.bestLapMs, 200)
  const after = crossGate(state, 'start', 9_000, 2)
  assert.equal(after.state.finished, true)
  assert.equal(after.state.lap, 2)
})

test('best lap keeps the smaller time', () => {
  let state = freshLap()
  state = crossGate(state, 'start', 0, null).state
  state = crossGate(state, 'checkpoint', 10, null).state
  state = crossGate(state, 'finish', 5_000, null).state
  state = crossGate(state, 'start', 6_000, null).state
  state = crossGate(state, 'checkpoint', 6_010, null).state
  state = crossGate(state, 'finish', 9_000, null).state
  assert.equal(state.lap, 2)
  assert.equal(state.lastLapMs, 3_000)
  assert.equal(state.bestLapMs, 3_000)
})

test('formatTime renders minutes, seconds, and tenths', () => {
  assert.equal(formatTime(null), '0:00.0')
  assert.equal(formatTime(0), '0:00.0')
  assert.equal(formatTime(12_340), '0:12.3')
  assert.equal(formatTime(75_600), '1:15.6')
})
