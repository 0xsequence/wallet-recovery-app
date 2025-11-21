import { Navigate, Route, HashRouter as Router, Routes } from 'react-router-dom'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'

import GitHubCorner from '~/assets/GithubCorner'

import Landing from './Landing'
import RecoverySelect from './RecoverySelect'
import RecoveryV2 from './RecoveryV2'
import RecoveryV3 from './RecoveryV3'
import Wallet from './Wallet'

export const AppRouter = () => {
  const authStore = useStore(AuthStore)
  const hasAccount = useObservable(authStore.accountAddress)

  return (
    <Router basename={'/'}>
      <Routes>
        <Route path="/" element={!hasAccount ? <Landing /> : <Navigate replace to="/wallet" />} />
        <Route
          path="recovery-v2"
          element={!hasAccount ? <RecoveryV2 /> : <Navigate replace to="/wallet" />}
        />
        <Route
          path="recovery-v3"
          element={!hasAccount ? <RecoveryV3 /> : <Navigate replace to="/wallet" />}
        />
        <Route
          path="recovery-select"
          element={!hasAccount ? <RecoverySelect /> : <Navigate replace to="/wallet" />}
        />
        <Route path="wallet" element={hasAccount ? <Wallet /> : <Navigate replace to="/" />} />
      </Routes>
      <GitHubCorner />
    </Router>
  )
}
