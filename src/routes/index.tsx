import { createBrowserRouter } from 'react-router-dom'

import Landing from './Landing'
import Recovery from './Recovery'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />
  },
  {
    path: 'recovery',
    element: <Recovery />
  }
])
