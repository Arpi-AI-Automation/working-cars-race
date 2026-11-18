import type { ComponentType, PropsWithChildren } from 'react'

import { useStore } from './store'

type Flag = 'ready' | 'sound'

export const useToggle =
  <P extends {}>(ToggledComponent: ComponentType<P>, toggle: Flag | Flag[]) =>
  (props: PropsWithChildren<P>) => {
    const keys = Array.isArray(toggle) ? toggle : [toggle]
    const values = useStore((state) => keys.map((key) => state[key]))
    return values.every((value) => !!value) ? <ToggledComponent {...props} /> : props.children ? <>{props.children}</> : null
  }
