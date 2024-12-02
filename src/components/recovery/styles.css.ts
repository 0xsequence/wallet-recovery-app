import { atoms } from '@0xsequence/design-system'
import { style } from '@vanilla-extract/css'

export const navDrawer = style([
  atoms({
    position: 'fixed',
    left: '0',

    width: 'vw',
    height: 'vh',
  }),
])
