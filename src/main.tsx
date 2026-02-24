import { ThemeProvider, ToastProvider } from '@0xsequence/design-system'
import React from 'react'
import ReactDOM from 'react-dom/client'

import { StoreProvider, createStore } from '~/stores/index.tsx'

import { AppRouter } from '~/routes/index.tsx'

import '~/css/globals.css'
import '~/css/reset.css'

import { NAVIGATION_KEY } from './constants/storage'
import { clearAllState } from './utils/clear-state'

const initApp = async () => {
  const navigationState = sessionStorage.getItem(NAVIGATION_KEY)
  if (!navigationState) {
    try {
      await clearAllState()
      sessionStorage.setItem(`${NAVIGATION_KEY}-redirect`, 'true')
    } catch (error) {
      console.error('Failed to clear state on refresh:', error)
    }
  }

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
}

initApp()
