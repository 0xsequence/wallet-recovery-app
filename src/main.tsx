import { ThemeProvider, ToastProvider } from '@0xsequence/design-system'
import '@0xsequence/design-system/styles.css'
import React from 'react'
import ReactDOM from 'react-dom/client'

import { StoreProvider, createStore } from '~/stores/index.tsx'

import { AppRouter } from '~/routes/index.tsx'

import '~/css/global.css'
import '~/css/reset.css'

const store = createStore()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StoreProvider store={store}>
      <ThemeProvider theme="dark">
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </ThemeProvider>
    </StoreProvider>
  </React.StrictMode>
)
