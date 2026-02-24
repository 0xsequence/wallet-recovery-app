/*
export const vars = {
  colors: {
    backgroundPrimary: '#1A1A1A',
    text50: '#999999',
    borderFocus: '#000000'
  },
  borderWidths: {
    thick: '2px'
  },
  borderFocus: '#000000',
  fontWeights: {
    bold: 700,
    normal: 400
  },
  fontSizes: {
    normal: '1rem'
  },
  lineHeights: {
    '5': '1.25'
  },
  letterSpacings: {
    wide: '0.05em'
  },
  space: {
    '3': '0.75rem',
    '4': '1rem'
  },
  fonts: {
    body: 'Inter, sans-serif'
  },
  textSizes: {
    normal: '1rem'
  },
  textWeights: {
    bold: 700,
    normal: 400
  },
  textLetterSpacings: {
    wide: '0.05em'
  },
  textSpace: {
    '3': '0.75rem',
    '4': '1rem'
  },
  textColors: {
    text50: '#999999'
  }
}

globalStyle(':root', {
  vars: {
    '--app-height': '100vh'
  }
})

globalStyle('html, body, #root', {
  margin: '0',
  padding: '0',
  minHeight: 'var(--app-height)',
  background: vars.colors.backgroundPrimary
})

globalStyle('body', {
  fontFamily: vars.fonts.body,

  overflowY: 'scroll',
  overflowX: 'hidden',
  width: '100%',
  fontSize: '1rem',

  textSizeAdjust: 'none',
  touchAction: 'manipulation'
})

globalStyle('#root', {
  width: '100%',
  paddingTop: '0.05px' // Fix margin-collapse
})

globalStyle('#portal', {
  width: 'auto',
  height: 'auto'
})

globalStyle('a', {
  textDecoration: 'none',
  color: 'inherit'
})

globalStyle(
  'input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button',
  {
    WebkitAppearance: 'none',
    margin: '0'
  }
)

globalStyle('b, strong', {
  fontWeight: vars.fontWeights.bold
})

globalStyle('ol, ul', {
  listStyle: 'none'
})

globalStyle('ul', {
  listStyleType: 'disc',
  padding: `0 ${vars.space['4']}`
})

globalStyle('ul li', {
  marginBottom: vars.space[3],
  position: 'relative',
  display: 'list-item',
  listStyleType: 'inherit'
})

globalStyle('p', {
  margin: `0 0 ${vars.space[3]}`
})

globalStyle('.markdown h1, h2, h3, h4, h5, h6', {
  fontSize: vars.fontSizes.normal,
  lineHeight: vars.lineHeights[5],
  letterSpacing: vars.letterSpacings.wide,
  fontWeight: vars.fontWeights.bold,
  margin: `0 0 ${vars.space[3]}`
})

globalStyle('.markdown p', {
  fontSize: vars.fontSizes.normal,
  lineHeight: vars.lineHeights[5],
  letterSpacing: vars.letterSpacings.wide,
  fontWeight: vars.fontWeights.normal
})

// Custom scrollbars
globalStyle(`html:not(.is-apple) *::-webkit-scrollbar`, {
  appearance: 'none',
  width: '13px',
  background: 'rgba(0, 0, 0, 0)'
})

globalStyle(`html:not(.is-apple) *::-webkit-scrollbar-thumb`, {
  background: vars.colors.text50,
  border: '3px solid transparent',
  backgroundClip: 'content-box',
  borderRadius: '7px'
})
*/