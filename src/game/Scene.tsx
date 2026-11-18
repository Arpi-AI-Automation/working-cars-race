import { useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Physics } from '@react-three/cannon'
import { Environment, Sky } from '@react-three/drei'

import { asset } from '../asset'
import { controlState } from '../controls/state'
import { BoundingBox, Heightmap, Ramp, Track, Train, Vehicle } from '../models'
import { runtimes } from '../runtime'
import { updateDrivingAudio } from '../sound'
import { speedTune, useStore } from '../store'
import { SplitView } from './SplitView'
import { Gates } from './World'

function DrivingAudio(): null {
  const sound = useStore((state) => state.sound)
  const phase = useStore((state) => state.phase)
  const speed = useStore((state) => state.speed)

  useEffect(() => () => updateDrivingAudio(0, false, false), [])

  useFrame(() => {
    if (!sound || phase !== 'driving') {
      updateDrivingAudio(0, false, false)
      return
    }
    const tune = speedTune(speed)
    let throttle = 0
    let braking = false
    controlState.forEach((input, index) => {
      const runtime = runtimes[index]
      const pace = runtime ? Math.min(1, Math.abs(runtime.forwardSpeed) / tune.maxSpeed) : 0
      if (input.forward || input.backward) throttle = Math.max(throttle, Math.max(0.45, pace))
      else throttle = Math.max(throttle, pace * 0.45)
      if (input.backward && (runtime?.forwardSpeed ?? 0) > 1.4) braking = true
    })
    updateDrivingAudio(throttle, braking, true)
  })

  return null
}

export function RaceScene(): JSX.Element {
  const players = useStore((state) => state.players)

  return (
    <>
      <color attach="background" args={['#b9e2ff']} />
      <fog attach="fog" args={['#d5ecff', 40, 320]} />
      <Sky sunPosition={[90, 30, 70]} turbidity={6} rayleigh={0.6} />
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[40, 60, 20]}
        intensity={1.25}
        castShadow
        shadow-bias={-0.0008}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
      />
      <Physics allowSleep broadphase="SAP" defaultContactMaterial={{ contactEquationRelaxation: 4, friction: 1e-3 }}>
        {players.map((player) => (
          <Vehicle key={`${player.id}-${player.vehicleId}`} playerId={player.id} vehicleId={player.vehicleId} />
        ))}
        <Train />
        <Ramp args={[30, 6, 8]} position={[2, -1, 168.55]} rotation={[0, 0.49, Math.PI / 15]} />
        <Heightmap elementSize={0.5085} position={[327 - 66.5, -3.3, -473 + 213]} rotation={[-Math.PI / 2, 0, -Math.PI]} />
        <Gates />
        <BoundingBox depth={512} height={100} position={[0, 40, 0]} width={512} />
      </Physics>
      <Track />
      <Environment files={asset('textures/dikhololo_night_1k.hdr')} />
      <DrivingAudio />
      <SplitView />
    </>
  )
}
