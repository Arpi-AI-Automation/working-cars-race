import { createRoot } from 'react-dom/client'
import { useGLTF, useTexture } from '@react-three/drei'
import 'inter-ui'
import './styles.css'
import { App } from './App'
import { asset } from './asset'
import { VEHICLES } from './vehicles'

useTexture.preload(asset('textures/heightmap_1024.png'))
useGLTF.preload(asset('models/track-draco.glb'))
VEHICLES.forEach((vehicle) => useGLTF.preload(asset(`models/vehicles/${vehicle.file}`)))

createRoot(document.getElementById('root')!).render(<App />)
