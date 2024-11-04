import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'

import Landing from './Landing'
import Recovery from './Recovery'
import Wallet from './Wallet'

export const AppRouter = () => {
  const authStore = useStore(AuthStore)
  const hasAccount = useObservable(authStore.accountAddress)

  return (
    <Router basename={'/wallet-recovery-app'}>
      <Routes>
        <Route path="/" element={!hasAccount ? <Landing /> : <Navigate replace to="/wallet" />} />
        <Route path="recovery" element={!hasAccount ? <Recovery /> : <Navigate replace to="/wallet" />} />
        <Route path="wallet" element={hasAccount ? <Wallet /> : <Navigate replace to="/" />} />
      </Routes>
    </Router>
  )
}
