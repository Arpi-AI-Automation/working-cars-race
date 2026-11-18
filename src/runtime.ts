import { Euler, Quaternion, Vector3 } from 'three'

import type { PublicApi, RaycastVehiclePublicApi } from '@react-three/cannon'
import type { Group, PerspectiveCamera } from 'three'

import type { spawnFor } from './vehicles'

export type Spawn = ReturnType<typeof spawnFor>

export type Runtime = {
  api: PublicApi
  chassis: Group
  spawn: Spawn
  speed: number
  forwardSpeed: number
  velocity: [number, number, number]
}

const pose = new Vector3()
const poseQ = new Quaternion()
const poseScale = new Vector3()

/** Physics writes the matrix directly, so position and quaternion on the object can be stale. */
export function readChassisPose(chassis: Group): { position: Vector3; quaternion: Quaternion } {
  chassis.matrix.decompose(pose, poseQ, poseScale)
  return { position: pose, quaternion: poseQ }
}

export const runtimes: Array<Runtime | undefined> = []
export const viewCameras: Array<PerspectiveCamera | null> = [null, null]

const yawEuler = new Euler()

export function resetToSpawn(id: number): void {
  const runtime = runtimes[id]
  if (!runtime) return
  const { position, rotation } = runtime.spawn
  runtime.api.position.set(position[0], position[1], position[2])
  runtime.api.rotation.set(rotation[0], rotation[1], rotation[2])
  runtime.api.velocity.set(0, 0, 0)
  runtime.api.angularVelocity.set(0, 0, 0)
  runtime.forwardSpeed = 0
  runtime.speed = 0
  runtime.velocity[0] = 0
  runtime.velocity[1] = 0
  runtime.velocity[2] = 0
}

export function resetUpright(id: number): void {
  const runtime = runtimes[id]
  if (!runtime) return
  const { chassis, api } = runtime
  const { position, quaternion } = readChassisPose(chassis)
  yawEuler.setFromQuaternion(quaternion, 'YXZ')
  api.position.set(position.x, Math.max(position.y, 1) + 1.6, position.z)
  api.rotation.set(0, yawEuler.y, 0)
  api.velocity.set(0, 0, 0)
  api.angularVelocity.set(0, 0, 0)
  runtime.forwardSpeed = 0
  runtime.speed = 0
  runtime.velocity[0] = 0
  runtime.velocity[1] = 0
  runtime.velocity[2] = 0
}

export function resetAllToSpawn(): void {
  runtimes.forEach((runtime, id) => {
    if (runtime) resetToSpawn(id)
  })
}

export type { RaycastVehiclePublicApi }
