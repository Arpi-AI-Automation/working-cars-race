import assert from 'node:assert/strict'
import { test } from 'node:test'

import { bindingForCode, handledCodes } from '../src/controls/bindings.ts'

test('player 1 uses the numpad and arrows, and nothing letter-based', () => {
  assert.deepEqual(bindingForCode('Numpad8'), { player: 0, control: 'forward' })
  assert.deepEqual(bindingForCode('ArrowUp'), { player: 0, control: 'forward' })
  assert.deepEqual(bindingForCode('Numpad5'), { player: 0, control: 'backward' })
  assert.deepEqual(bindingForCode('ArrowDown'), { player: 0, control: 'backward' })
  assert.deepEqual(bindingForCode('Numpad4'), { player: 0, control: 'left' })
  assert.deepEqual(bindingForCode('ArrowLeft'), { player: 0, control: 'left' })
  assert.deepEqual(bindingForCode('Numpad6'), { player: 0, control: 'right' })
  assert.deepEqual(bindingForCode('ArrowRight'), { player: 0, control: 'right' })
  assert.equal(bindingForCode('KeyW'), null)
  assert.equal(bindingForCode('KeyA'), null)
  assert.equal(bindingForCode('KeyS'), null)
})

test('player 2 is D accelerate, X brake, Z left, C right', () => {
  assert.deepEqual(bindingForCode('KeyD'), { player: 1, control: 'forward' })
  assert.deepEqual(bindingForCode('KeyX'), { player: 1, control: 'backward' })
  assert.deepEqual(bindingForCode('KeyZ'), { player: 1, control: 'left' })
  assert.deepEqual(bindingForCode('KeyC'), { player: 1, control: 'right' })
})

test('letter keys used by player 2 are not also player 1 keys', () => {
  assert.equal(bindingForCode('KeyC')?.player, 1)
  assert.equal(bindingForCode('KeyD')?.player, 1)
  assert.notEqual(bindingForCode('KeyC')?.player, 0)
  handledCodes.forEach((code) => {
    assert.equal(bindingForCode(code) != null, true)
  })
})
