import { asset } from './asset'

type ClipName = 'engine' | 'accelerate' | 'brake'

const files: Record<ClipName, string> = {
  engine: 'sounds/engine.mp3',
  accelerate: 'sounds/accelerate.mp3',
  brake: 'sounds/tire-brake.mp3',
}

const clips = new Map<ClipName, HTMLAudioElement>()

const ignorePlaybackError = (): void => undefined

const clip = (name: ClipName): HTMLAudioElement => {
  const existing = clips.get(name)
  if (existing) return existing
  const audio = new Audio(asset(files[name]))
  audio.loop = name !== 'brake'
  audio.preload = 'auto'
  clips.set(name, audio)
  return audio
}

/** Call from the click that starts a race so the browser allows playback. */
const clipNames: ClipName[] = ['engine', 'accelerate', 'brake']

export function primeAudio(): void {
  clipNames.forEach((name) => {
    const audio = clip(name)
    audio.volume = 0
    const pending = audio.play()
    pending
      .then(() => {
        audio.pause()
        audio.currentTime = 0
      })
      .catch(ignorePlaybackError)
  })
}

export function updateDrivingAudio(throttle: number, braking: boolean, enabled: boolean): void {
  const engine = clips.get('engine')
  const accelerate = clips.get('accelerate')
  const brake = clips.get('brake')
  if (!engine || !accelerate || !brake) return

  if (!enabled) {
    engine.pause()
    accelerate.pause()
    brake.pause()
    return
  }

  const amount = Math.max(0, Math.min(1, throttle))
  engine.volume = 0.18 + amount * 0.22
  engine.playbackRate = 0.85 + amount * 0.55
  if (engine.paused) engine.play().catch(ignorePlaybackError)

  accelerate.volume = amount > 0.25 ? 0.18 : 0
  accelerate.playbackRate = 0.9 + amount * 0.4
  if (amount > 0.25 && accelerate.paused) accelerate.play().catch(ignorePlaybackError)
  if (amount <= 0.25 && !accelerate.paused) accelerate.pause()

  if (braking) {
    brake.volume = 0.35
    if (brake.paused) brake.play().catch(ignorePlaybackError)
  } else if (!brake.paused) {
    brake.pause()
    brake.currentTime = 0
  }
}
