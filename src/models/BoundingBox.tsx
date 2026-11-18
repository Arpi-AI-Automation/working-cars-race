import { usePlane } from '@react-three/cannon'

import type { Object3D } from 'three'
import type { Triplet } from '@react-three/cannon'

import { resetToSpawn } from '../runtime'

type Props = {
  depth: number
  height: number
  position: Triplet
  width: number
}

const playerIdFrom = (event: { body: Object3D; target: Object3D }): number | null => {
  const id = event.body?.userData?.playerId ?? event.target?.userData?.playerId
  return typeof id === 'number' ? id : null
}

export const BoundingBox = ({ depth, height, position: [x, y, z], width }: Props): null => {
  const halfDepth = depth / 2
  const halfHeight = height / 2
  const halfPi = Math.PI / 2
  const halfWidth = width / 2

  const onCollideBegin = (event: { body: Object3D; target: Object3D }) => {
    const playerId = playerIdFrom(event)
    if (playerId == null) return
    resetToSpawn(playerId)
  }

  const shared = { isTrigger: true, onCollideBegin, userData: { trigger: true } }

  usePlane(() => ({ ...shared, position: [x - halfWidth, y, z], rotation: [0, halfPi, 0] }))
  usePlane(() => ({ ...shared, position: [x, y - halfHeight, z], rotation: [halfPi, 0, 0] }))
  usePlane(() => ({ ...shared, position: [x, y, z - halfDepth], rotation: [0, 0, 0] }))
  usePlane(() => ({ ...shared, position: [x + halfWidth, y, z], rotation: [0, -halfPi, 0] }))
  usePlane(() => ({ ...shared, position: [x, y + halfHeight, z], rotation: [-halfPi, 0, 0] }))
  usePlane(() => ({ ...shared, position: [x, y, z + halfDepth], rotation: [0, Math.PI, 0] }))

  return null
}
