import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useBox, useCompoundBody, useRaycastVehicle } from '@react-three/cannon'
import { useGLTF } from '@react-three/drei'
import { Quaternion, Vector3 } from 'three'

import type { RefObject } from 'react'
import type { Group, PerspectiveCamera as PerspectiveCameraImpl } from 'three'
import type { Triplet } from '@react-three/cannon'

import { controlState } from '../../controls/state'
import { getState, speedTune } from '../../store'
import { readChassisPose, resetToSpawn, resetUpright, runtimes, viewCameras } from '../../runtime'
import { MODEL_SCALE, SPAWNS, vehicleUrl } from '../../vehicles'
import type { VehicleId } from '../../vehicles'
import { SUSPENSION_REST, buildVehicle } from './buildVehicle'
import type { BuiltWheel } from './buildVehicle'

function WheelView({ wheel, wheelRef }: { wheel: BuiltWheel; wheelRef: RefObject<Group> }): JSX.Element {
  useCompoundBody(
    () => ({
      mass: 40,
      type: 'Kinematic',
      collisionFilterGroup: 0,
      material: 'wheel',
      shapes: [{ args: [wheel.radius, wheel.radius, 0.3, 12], rotation: [0, 0, -Math.PI / 2], type: 'Cylinder' }],
    }),
    wheelRef,
    [wheel.radius],
  )

  return (
    <group ref={wheelRef}>
      <group scale={MODEL_SCALE} quaternion={wheel.quaternion}>
        <mesh geometry={wheel.geometry} material={wheel.material} position={wheel.center.clone().multiplyScalar(-1)} castShadow dispose={null} />
      </group>
    </group>
  )
}

const PLAYER_COLORS = ['#ff5d8f', '#3d8bfd'] as const
const nose = new Vector3()
const velocity = new Vector3()
const camTarget = new Vector3()
const up = new Vector3()
const poseQ = new Quaternion()

type VehicleProps = {
  playerId: 0 | 1
  vehicleId: VehicleId
}

export function Vehicle({ playerId, vehicleId }: VehicleProps): JSX.Element {
  const gltf = useGLTF(vehicleUrl(vehicleId))
  const built = useMemo(() => buildVehicle(gltf.scene), [gltf.scene])
  const chassis = useRef<Group>(null!)
  const camera = useRef<PerspectiveCameraImpl>(null!)
  const wheel0 = useRef<Group>(null!)
  const wheel1 = useRef<Group>(null!)
  const wheel2 = useRef<Group>(null!)
  const wheel3 = useRef<Group>(null!)
  const wheelRefs = [wheel0, wheel1, wheel2, wheel3]
  const steer = useRef(0)
  const flippedFor = useRef(0)
  const spawn = SPAWNS[playerId]

  const [, api] = useBox(
    () => ({
      mass: 560,
      args: built.box,
      allowSleep: false,
      angularDamping: 0.55,
      linearDamping: 0.06,
      position: spawn.position,
      rotation: spawn.rotation,
      angularVelocity: [0, 0.35, 0],
      userData: { playerId },
    }),
    chassis,
    [playerId, vehicleId],
  )

  const [, vehicleApi] = useRaycastVehicle(
    () => ({
      chassisBody: chassis,
      wheels: wheelRefs,
      indexForwardAxis: 2,
      indexRightAxis: 0,
      indexUpAxis: 1,
      wheelInfos: built.wheels.map((wheel) => ({
        axleLocal: [-1, 0, 0] as Triplet,
        chassisConnectionPointLocal: wheel.connection,
        directionLocal: [0, -1, 0] as Triplet,
        frictionSlip: 3.5,
        isFrontWheel: wheel.front,
        maxSuspensionForce: 100000,
        maxSuspensionTravel: 0.45,
        radius: wheel.radius,
        rollInfluence: 0,
        sideAcceleration: 1.5,
        suspensionRestLength: SUSPENSION_REST,
        suspensionStiffness: 48,
        useCustomSlidingRotationalSpeed: false,
      })),
    }),
    undefined,
    [playerId, vehicleId],
  )

  useLayoutEffect(() => {
    chassis.current.userData.playerId = playerId
    runtimes[playerId] = { api, chassis: chassis.current, spawn, speed: 0, forwardSpeed: 0, velocity: [0, 0, 0] }
    viewCameras[playerId] = camera.current
    const unsubscribe = api.velocity.subscribe((value) => {
      const runtime = runtimes[playerId]
      if (!runtime) return
      runtime.velocity[0] = value[0]
      runtime.velocity[1] = value[1]
      runtime.velocity[2] = value[2]
      runtime.speed = Math.hypot(value[0], value[1], value[2])
    })
    return () => {
      unsubscribe()
      runtimes[playerId] = undefined
      viewCameras[playerId] = null
    }
  }, [api, playerId, spawn])

  useFrame((_, delta) => {
    const body = chassis.current
    if (!body) return
    body.userData.playerId = playerId
    const phase = getState().phase
    const tune = speedTune(getState().speed)
    const input = controlState[playerId]
    const driving = phase === 'driving'
    const runtime = runtimes[playerId]
    const { position: pose, quaternion } = readChassisPose(body)
    poseQ.copy(quaternion)
    if (runtime) {
      velocity.set(runtime.velocity[0], runtime.velocity[1], runtime.velocity[2])
      nose.set(0, 0, 1).applyQuaternion(poseQ)
      runtime.forwardSpeed = velocity.dot(nose)
    }
    const forwardSpeed = runtime?.forwardSpeed ?? 0

    let engine = 0
    let brake = 0
    if (driving && input.forward && !input.backward) {
      engine = forwardSpeed < tune.maxSpeed ? -tune.force : 0
    } else if (driving && input.backward && !input.forward) {
      if (forwardSpeed > 1.4) brake = tune.maxBrake
      else if (forwardSpeed > -tune.reverseSpeed) engine = tune.force * 0.62
    } else if (driving && input.backward && input.forward) {
      brake = tune.maxBrake
    }

    const steerTarget = !driving ? 0 : input.left && !input.right ? tune.steer : input.right && !input.left ? -tune.steer : 0
    steer.current += (steerTarget - steer.current) * Math.min(1, delta * 12)

    for (let index = 0; index < 4; index += 1) {
      // A little power on the front wheels too, so a gentle bump does not strand a child.
      vehicleApi.applyEngineForce(engine * (index < 2 ? 0.45 : 0.8), index)
      vehicleApi.setBrake(brake, index)
    }
    vehicleApi.setSteeringValue(steer.current, 0)
    vehicleApi.setSteeringValue(steer.current, 1)

    const follow = camera.current
    if (follow) {
      camTarget.set(steer.current * 1.15, built.camera[1], built.camera[2] + (brake > 0 ? 0.7 : 0))
      follow.position.lerp(camTarget, 1 - Math.exp(-delta * 3.2))
      const tilt = -steer.current * Math.max(-1, Math.min(1, forwardSpeed / tune.maxSpeed)) * 0.18
      follow.rotation.z += (tilt - follow.rotation.z) * Math.min(1, delta * 4)
    }

    up.set(0, 1, 0).applyQuaternion(poseQ)
    const fellOff = pose.y < -3
    if (up.y < 0.3 || fellOff) flippedFor.current += delta
    else flippedFor.current = 0
    if (flippedFor.current > 1.1) {
      flippedFor.current = 0
      if (fellOff) resetToSpawn(playerId)
      else resetUpright(playerId)
    }
  })

  return (
    <group>
      <group ref={chassis}>
        <primitive object={built.body} dispose={null} />
        <perspectiveCamera ref={camera} fov={58} near={0.1} far={500} rotation={[0.12, Math.PI, 0]} position={built.camera} />
        <mesh position={[0, built.box[1] * 0.72 + 0.85, 0]} castShadow>
          <sphereGeometry args={[0.28, 18, 18]} />
          <meshStandardMaterial color={PLAYER_COLORS[playerId]} emissive={PLAYER_COLORS[playerId]} emissiveIntensity={0.35} roughness={0.4} />
        </mesh>
      </group>
      {built.wheels.map((wheel, index) => (
        <WheelView key={wheel.name} wheel={wheel} wheelRef={wheelRefs[index]} />
      ))}
    </group>
  )
}
