import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'

import { Keyboard } from './controls/Keyboard'
import { RaceScene } from './game/Scene'
import { useStore } from './store'
import { Garage, Hud, LoadingScreen, Menu, Winner } from './ui/Screens'

export function App(): JSX.Element {
  const phase = useStore((state) => state.phase)
  const playing = phase === 'driving' || phase === 'winner'

  return (
    <>
      {playing && (
        <Suspense fallback={<LoadingScreen />}>
          <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 8, 16], fov: 50 }} gl={{ antialias: true }}>
            <RaceScene />
          </Canvas>
        </Suspense>
      )}
      {phase === 'menu' && <Menu />}
      {phase === 'garage' && <Garage />}
      {phase === 'driving' && <Hud />}
      {phase === 'winner' && (
        <>
          <Hud />
          <Winner />
        </>
      )}
      <Keyboard />
    </>
  )
}
