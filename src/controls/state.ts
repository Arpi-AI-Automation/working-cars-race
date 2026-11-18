import { idleControls } from './bindings'
import type { Control, ControlState } from './bindings'

export const controlState: [ControlState, ControlState] = [idleControls(), idleControls()]

export function setControl(player: 0 | 1, control: Control, down: boolean): void {
  controlState[player][control] = down
}

export function releaseControls(): void {
  controlState.forEach((player) => {
    player.forward = false
    player.backward = false
    player.left = false
    player.right = false
  })
}
