import React from 'react'
import ReactDOM from 'react-dom/client'

import './css/reset.css'
import '@0xsequence/design-system/styles.css'
import './css/global.css'

import { ThemeProvider } from '@0xsequence/design-system'
import { RouterProvider } from 'react-router-dom'

import { router } from './routes/index.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme="dark">
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
)
