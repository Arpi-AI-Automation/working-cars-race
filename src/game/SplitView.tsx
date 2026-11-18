import { Color } from 'three'
import { useFrame } from '@react-three/fiber'

import { useStore } from '../store'
import { viewCameras } from '../runtime'

const clear = new Color('#b9e2ff')

/**
 * One camera per child, drawn with a scissor. Landscape is left/right, portrait is top/bottom.
 * Priority 1 turns off the default full-frame render.
 */
export function SplitView(): null {
  const count = useStore((state) => (state.mode === 'race' ? 2 : 1))

  useFrame(({ gl, scene, size }) => {
    const width = Math.floor(size.width * gl.getPixelRatio())
    const height = Math.floor(size.height * gl.getPixelRatio())
    const portrait = size.height > size.width
    gl.setClearColor(clear, 1)
    gl.autoClear = false
    gl.setScissorTest(true)

    for (let index = 0; index < count; index += 1) {
      const camera = viewCameras[index]
      if (!camera) continue
      let x = 0
      let y = 0
      let viewWidth = width
      let viewHeight = height
      if (count === 2 && portrait) {
        viewHeight = Math.floor(height / 2)
        y = index === 0 ? viewHeight : 0
      } else if (count === 2) {
        viewWidth = Math.floor(width / 2)
        x = index === 0 ? 0 : viewWidth
      }
      camera.aspect = viewWidth / Math.max(1, viewHeight)
      camera.updateProjectionMatrix()
      gl.setViewport(x, y, viewWidth, viewHeight)
      gl.setScissor(x, y, viewWidth, viewHeight)
      gl.clear(true, true, true)
      gl.render(scene, camera)
    }
  }, 1)

  return null
}
