import { createRef } from 'react'
import create from 'zustand'

import type { RefObject } from 'react'
import type { Group } from 'three'

import { releaseControls } from './controls/state'
import { crossGate, freshLap } from './lap'
import type { Gate, LapState } from './lap'
import { resetAllToSpawn } from './runtime'
import { RACE_LAPS } from './vehicles'
import type { VehicleId } from './vehicles'

export const levelLayer = 1 as const

export type Phase = 'menu' | 'garage' | 'driving' | 'winner'
export type Mode = 'practice' | 'race'
export type SpeedMode = 'gentle' | 'fast'

export type SpeedTune = {
  force: number
  maxBrake: number
  maxSpeed: number
  reverseSpeed: number
  steer: number
}

export const speedTune = (mode: SpeedMode): SpeedTune =>
  mode === 'gentle'
    ? { force: 3200, maxBrake: 48, maxSpeed: 42, reverseSpeed: 16, steer: 0.55 }
    : { force: 4600, maxBrake: 70, maxSpeed: 68, reverseSpeed: 22, steer: 0.46 }

export type Player = {
  id: 0 | 1
  vehicleId: VehicleId
  lap: LapState
  message: string | null
  messageAt: number
}

type State = {
  phase: Phase
  mode: Mode
  speed: SpeedMode
  sound: boolean
  ready: boolean
  level: RefObject<Group>
  players: Player[]
  winnerId: 0 | 1 | null
  setSpeed: (speed: SpeedMode) => void
  toggleSound: () => void
  openGarage: (mode: Mode) => void
  backToMenu: () => void
  begin: (ids: VehicleId[]) => void
  backToGarage: () => void
  hitGate: (playerId: number, gate: Gate) => void
  rematch: () => void
}

const GATE_LOCK_MS = 1200
const lastGateAt: Record<string, number> = {}

const makePlayer = (vehicleId: VehicleId, id: 0 | 1): Player => ({
  id,
  vehicleId,
  lap: freshLap(),
  message: null,
  messageAt: 0,
})

const useStoreImpl = create<State>((set, get) => ({
  phase: 'menu',
  mode: 'practice',
  speed: 'gentle',
  sound: true,
  ready: true,
  level: createRef<Group>(),
  players: [],
  winnerId: null,
  setSpeed: (speed) => set({ speed }),
  toggleSound: () => set((state) => ({ sound: !state.sound })),
  openGarage: (mode) => {
    releaseControls()
    set({ phase: 'garage', mode, winnerId: null })
  },
  backToMenu: () => {
    releaseControls()
    set({ phase: 'menu', winnerId: null })
  },
  begin: (ids) => {
    releaseControls()
    Object.keys(lastGateAt).forEach((key) => delete lastGateAt[key])
    set({
      phase: 'driving',
      winnerId: null,
      ready: true,
      players: ids.map((vehicleId, index) => makePlayer(vehicleId, index === 0 ? 0 : 1)),
    })
  },
  backToGarage: () => {
    releaseControls()
    set({ phase: 'garage', winnerId: null })
  },
  hitGate: (playerId, gate) => {
    const now = Date.now()
    const key = `${playerId}:${gate}`
    if (now - (lastGateAt[key] ?? 0) < GATE_LOCK_MS) return
    const { players, mode, phase } = get()
    if (phase !== 'driving') return
    const player = players.find((entry) => entry.id === playerId)
    if (!player || player.lap.finished) return
    const result = crossGate(player.lap, gate, now, mode === 'race' ? RACE_LAPS : null)
    if (result.state === player.lap) return
    lastGateAt[key] = now
    const playersNext = players.map((entry) =>
      entry.id === playerId
        ? {
            ...entry,
            lap: result.state,
            message: result.message ?? entry.message,
            messageAt: result.message ? now : entry.messageAt,
          }
        : entry,
    )
    if (result.state.finished) releaseControls()
    set({
      players: playersNext,
      phase: result.state.finished ? 'winner' : phase,
      winnerId: result.state.finished ? player.id : get().winnerId,
    })
  },
  rematch: () => {
    releaseControls()
    resetAllToSpawn()
    Object.keys(lastGateAt).forEach((key) => delete lastGateAt[key])
    set((state) => ({
      phase: 'driving',
      winnerId: null,
      players: state.players.map((player) => ({ ...player, lap: freshLap(), message: null, messageAt: 0 })),
    }))
  },
}))

export const getState = useStoreImpl.getState
export const useStore = useStoreImpl
