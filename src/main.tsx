import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './css/reset.css'
import '@0xsequence/design-system/styles.css'
import './css/global.css'
import { ThemeProvider } from '@0xsequence/design-system'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme="dark">
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
