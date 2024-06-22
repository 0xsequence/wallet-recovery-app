import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@0xsequence/design-system'

import './css/reset.css'
import '@0xsequence/design-system/styles.css'
import './css/global.css'

import { AppRouter } from './routes/index.tsx'
import { StoreProvider, createStore } from './stores/index.tsx'

const store = createStore()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StoreProvider store={store}>
      <ThemeProvider theme="dark">
        <AppRouter />
      </ThemeProvider>
    </StoreProvider>
  </React.StrictMode>
)
