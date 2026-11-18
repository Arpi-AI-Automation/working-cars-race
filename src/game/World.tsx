import { useBox } from '@react-three/cannon'

import type { Object3D } from 'three'
import type { Triplet } from '@react-three/cannon'

import { useStore } from '../store'
import type { Gate } from '../lap'

const playerIdFrom = (event: { body: Object3D; target: Object3D }): number | null => {
  const objects = [event.body, event.target]
  for (const object of objects) {
    const id = object?.userData?.playerId
    if (typeof id === 'number') return id
  }
  return null
}

function GateBox({ gate, args, position, rotation }: { gate: Gate; args: Triplet; position: Triplet; rotation: Triplet }): null {
  useBox(() => ({
    isTrigger: true,
    args,
    position,
    rotation,
    userData: { trigger: true, gate },
    onCollideBegin: (event) => {
      const playerId = playerIdFrom(event)
      if (playerId == null) return
      useStore.getState().hitGate(playerId, gate)
    },
  }))
  return null
}

/**
 * Thicker and a little wider than the original hairline gates so a child
 * still registers a lap, and a fast step cannot skip the volume.
 */
const GATE_ARGS: Triplet = [8, 14, 40]

export function Gates(): JSX.Element {
  return (
    <>
      <GateBox gate="start" args={GATE_ARGS} position={[-27, 1, 180]} rotation={[0, 0.55, 0]} />
      <GateBox gate="finish" args={GATE_ARGS} position={[-104, 1, -189]} rotation={[0, -1.2, 0]} />
      <GateBox gate="checkpoint" args={GATE_ARGS} position={[-50, 1, -5]} rotation={[0, -0.5, 0]} />
    </>
  )
}
