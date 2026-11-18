export type Control = 'forward' | 'backward' | 'left' | 'right'

export type ControlState = Record<Control, boolean>

export const idleControls = (): ControlState => ({
  forward: false,
  backward: false,
  left: false,
  right: false,
})

/**
 * Physical key codes (`KeyboardEvent.code`) so the layout of the keyboard does not matter.
 * Player 1 also accepts the arrow keys when there is no numeric keypad.
 * Player 2 is Z / X / C / D only — nothing else in the game listens for letters.
 */
export const PLAYER_CODES: Record<0 | 1, Record<Control, readonly string[]>> = {
  0: {
    forward: ['Numpad8', 'ArrowUp'],
    backward: ['Numpad5', 'ArrowDown'],
    left: ['Numpad4', 'ArrowLeft'],
    right: ['Numpad6', 'ArrowRight'],
  },
  1: {
    forward: ['KeyD'],
    backward: ['KeyX'],
    left: ['KeyZ'],
    right: ['KeyC'],
  },
}

export type Binding = { player: 0 | 1; control: Control }

const codeMap: Record<string, Binding> = {}
;(Object.keys(PLAYER_CODES) as unknown as Array<0 | 1>).forEach((playerKey) => {
  const player = Number(playerKey) as 0 | 1
  ;(Object.keys(PLAYER_CODES[player]) as Control[]).forEach((control) => {
    PLAYER_CODES[player][control].forEach((code) => {
      codeMap[code] = { player, control }
    })
  })
})

export function bindingForCode(code: string): Binding | null {
  return codeMap[code] ?? null
}

export const handledCodes: ReadonlySet<string> = new Set(Object.keys(codeMap))
