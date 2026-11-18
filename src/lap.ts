export type Gate = 'start' | 'checkpoint' | 'finish'

export type LapState = {
  armed: boolean
  checkpoint: boolean
  lap: number
  lapStartedAt: number | null
  lastLapMs: number | null
  bestLapMs: number | null
  finished: boolean
}

export const freshLap = (): LapState => ({
  armed: false,
  checkpoint: false,
  lap: 0,
  lapStartedAt: null,
  lastLapMs: null,
  bestLapMs: null,
  finished: false,
})

export type GateResult = {
  state: LapState
  message: string | null
}

/**
 * A lap is start → checkpoint → finish, matching the desert circuit's timed straight.
 * `lapTarget` of null (practice) never marks the run finished.
 */
export function crossGate(state: LapState, gate: Gate, now: number, lapTarget: number | null): GateResult {
  if (state.finished) return { state, message: null }
  const next: LapState = { ...state }

  if (gate === 'start') {
    if (!next.armed) {
      next.armed = true
      next.checkpoint = false
      next.lapStartedAt = now
      return { state: next, message: 'スタート！' }
    }
    return { state, message: null }
  }

  if (gate === 'checkpoint') {
    if (next.armed && !next.checkpoint) {
      next.checkpoint = true
      return { state: next, message: 'チェックポイント！' }
    }
    return { state, message: null }
  }

  if (next.armed && next.checkpoint) {
    const lapMs = next.lapStartedAt == null ? 0 : Math.max(0, now - next.lapStartedAt)
    next.lap += 1
    next.lastLapMs = lapMs
    next.bestLapMs = next.bestLapMs == null ? lapMs : Math.min(next.bestLapMs, lapMs)
    next.armed = false
    next.checkpoint = false
    next.lapStartedAt = null
    if (lapTarget != null && next.lap >= lapTarget) next.finished = true
    return { state: next, message: next.finished ? null : 'ラップ！' }
  }

  return { state, message: null }
}

export function formatTime(ms: number | null): string {
  if (ms == null || ms < 0) return '0:00.0'
  const clamped = Math.max(0, ms)
  const minutes = Math.floor(clamped / 60000)
  const seconds = Math.floor((clamped % 60000) / 1000)
  const tenths = Math.floor((clamped % 1000) / 100)
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`
}
