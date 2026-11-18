import { useEffect } from 'react'

import { getState } from '../store'
import { bindingForCode } from './bindings'
import { releaseControls, setControl } from './state'

export function Keyboard(): null {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const binding = bindingForCode(event.code)
      if (!binding) return
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      event.preventDefault()
      if (event.repeat) return
      if (getState().phase !== 'driving') return
      setControl(binding.player, binding.control, true)
    }

    const onKeyUp = (event: KeyboardEvent) => {
      const binding = bindingForCode(event.code)
      if (!binding) return
      setControl(binding.player, binding.control, false)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', releaseControls)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', releaseControls)
      releaseControls()
    }
  }, [])

  return null
}
