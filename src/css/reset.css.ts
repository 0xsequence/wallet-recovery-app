import { vars } from '@0xsequence/design-system'
import { globalStyle } from '@vanilla-extract/css'

import * as layers from './layers.css'

globalStyle('*', {
  '@layer': {
    [layers.reset]: {
      margin: '0',
      padding: '0',

      WebkitTapHighlightColor: 'transparent'
    }
  }
})

// Use border-box box sizing
globalStyle('*, *::before, *::after', {
  '@layer': {
    [layers.reset]: {
      boxSizing: 'border-box'
    }
  }
})

// Disable focus outline
globalStyle('*:focus', {
  '@layer': {
    [layers.reset]: {
      outline: 'none'
    }
  }
})

// Custom Box shadow focus ring for focus-visible
globalStyle('*:focus-visible', {
  '@layer': {
    [layers.reset]: {
      outline: 'none',

      // Safari does not apply a border radius to outlines so we will use a boxShadow instead to acheive that same inset effect
      boxShadow: `0 0 0 ${vars.borderWidths.thick} ${vars.colors.borderFocus} inset`,

      // Because we use a semi transparent focus ring we want to set any border color to transparent so it doesnt show through
      borderColor: 'transparent'
    }
  }
})

// Improve font rendering
globalStyle('body', {
  '@layer': {
    [layers.reset]: {
      WebkitFontSmoothing: 'antialiased'
    }
  }
})

// Improve media defaults
globalStyle('img, picture, video, canvas, svg', {
  '@layer': {
    [layers.reset]: {
      display: 'block',
      maxWidth: '100%'
    }
  }
})

// Remove built-in form typography styles
globalStyle('input, button, textarea, select', {
  '@layer': {
    [layers.reset]: {
      font: 'inherit'
    }
  }
})
