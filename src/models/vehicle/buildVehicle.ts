import { Box3, Vector3 } from 'three'

import type { BufferGeometry, Group, Material, Mesh, Quaternion } from 'three'

import { MODEL_SCALE } from '../../vehicles'

const WHEEL_NAMES = ['wheel-front-left', 'wheel-front-right', 'wheel-back-left', 'wheel-back-right'] as const

/** How far the wheel hangs below the chassis connection at rest. */
export const SUSPENSION_REST = 0.2

export type BuiltWheel = {
  name: string
  front: boolean
  radius: number
  connection: [number, number, number]
  geometry: BufferGeometry
  material: Material | Material[]
  center: Vector3
  quaternion: Quaternion
}

export type BuiltVehicle = {
  body: Group
  wheels: BuiltWheel[]
  box: [number, number, number]
  camera: [number, number, number]
}

const soften = (material: Material) => {
  const standard = material as Material & { metalness?: number; roughness?: number }
  standard.metalness = 0
  standard.roughness = 0.86
}

/**
 * Kenney vehicles are authored in metres with the origin on the ground and loose wheel nodes.
 * Clone the cached glTF, pull the wheels off for the raycast vehicle, and size the chassis box to the body.
 */
export function buildVehicle(source: Group): BuiltVehicle {
  const root = source.clone(true)
  const wheelNodes: Mesh[] = []
  root.traverse((obj) => {
    const mesh = obj as Mesh
    if (mesh.isMesh && mesh.name.startsWith('wheel-')) wheelNodes.push(mesh)
  })
  wheelNodes.forEach((node) => node.removeFromParent())

  root.traverse((obj) => {
    const mesh = obj as Mesh
    if (!mesh.isMesh) return
    mesh.castShadow = true
    mesh.receiveShadow = true
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    materials.forEach(soften)
  })

  root.updateWorldMatrix(true, true)
  const bounds = new Box3().setFromObject(root)
  const size = bounds.getSize(new Vector3())
  const center = bounds.getCenter(new Vector3())
  // Chassis origin sits above the ground contact so the box does not scrape.
  const origin = new Vector3(0, 0.95, center.z)
  const scale = MODEL_SCALE

  const wheels = WHEEL_NAMES.map((name) => {
    const node = wheelNodes.find((wheel) => wheel.name === name)
    if (!node) throw new Error(`Vehicle model is missing ${name}`)
    node.geometry.computeBoundingBox()
    const box = node.geometry.boundingBox
    if (!box) throw new Error(`Wheel ${name} has no bounds`)
    const geoCenter = box.getCenter(new Vector3())
    const geoSize = box.getSize(new Vector3())
    const radius = (Math.max(geoSize.y, geoSize.z) / 2) * scale
    const modelPos = node.position.clone().add(geoCenter.clone().applyQuaternion(node.quaternion))
    const local = modelPos.sub(origin).multiplyScalar(scale)
    // Preload the spring so the tyre is pressed into the road and can actually grip.
    local.y += SUSPENSION_REST + 0.45
    return {
      name,
      front: name.includes('front'),
      radius,
      connection: [local.x, local.y, local.z] as [number, number, number],
      geometry: node.geometry,
      material: node.material,
      center: geoCenter,
      quaternion: node.quaternion.clone(),
    }
  })

  root.position.copy(origin).multiplyScalar(-scale)
  root.scale.setScalar(scale)

  const box: [number, number, number] = [Math.max(0.9, size.x * scale * 0.75), 0.5, Math.max(1.2, size.z * scale * 0.8)]

  return {
    body: root,
    wheels,
    box,
    camera: [0, size.y * scale * 0.32 + 1.55, -(size.z * scale * 0.62 + 3.1)],
  }
}
