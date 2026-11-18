import { asset } from './asset'

export const MODEL_SCALE = 1.45
export const RACE_LAPS = 2

export const VEHICLES = [
  {
    id: 'ambulance',
    en: 'Ambulance',
    ja: '救急車',
    file: 'ambulance.glb',
    icon: 'ambulance.png',
    color: '#e23d4a',
  },
  {
    id: 'firetruck',
    en: 'Fire truck',
    ja: '消防車',
    file: 'firetruck.glb',
    icon: 'firetruck.png',
    color: '#d62828',
  },
  {
    id: 'garbage',
    en: 'Garbage truck',
    ja: 'ゴミ収集車',
    file: 'garbage-truck.glb',
    icon: 'garbage-truck.png',
    color: '#2f9e44',
  },
  {
    id: 'tractor',
    en: 'Tractor',
    ja: 'トラクター',
    file: 'tractor.glb',
    icon: 'tractor.png',
    color: '#e6a317',
  },
  {
    id: 'truck',
    en: 'Truck',
    ja: 'トラック',
    file: 'truck.glb',
    icon: 'truck.png',
    color: '#3b6fd8',
  },
] as const

export type VehicleId = (typeof VEHICLES)[number]['id']
export type VehicleInfo = (typeof VEHICLES)[number]

export const vehicleById = (id: VehicleId): VehicleInfo => {
  const found = VEHICLES.find((vehicle) => vehicle.id === id)
  if (!found) throw new Error(`Unknown vehicle ${id}`)
  return found
}

export const vehicleUrl = (id: VehicleId): string => asset(`models/vehicles/${vehicleById(id).file}`)

export const vehicleIcon = (id: VehicleId): string => asset(`images/vehicles/${vehicleById(id).icon}`)

/** Spawn just before the start gate. Nose points toward the gate. */
export const SPAWN_YAW = Math.PI / 2 + 0.35
export const SPAWN_POSITION: [number, number, number] = [-62, 2.2, 204]

/**
 * Side-by-side grid. Offset is the car's right vector so both still face the start line.
 */
export function spawnFor(index: number): { position: [number, number, number]; rotation: [number, number, number] } {
  const noseX = Math.sin(SPAWN_YAW)
  const noseZ = Math.cos(SPAWN_YAW)
  const rightX = noseZ
  const rightZ = -noseX
  const side = index === 0 ? -1.7 : 1.7
  return {
    position: [SPAWN_POSITION[0] + rightX * side, SPAWN_POSITION[1], SPAWN_POSITION[2] + rightZ * side],
    rotation: [0, SPAWN_YAW, 0],
  }
}

export const SPAWNS = [spawnFor(0), spawnFor(1)] as const
