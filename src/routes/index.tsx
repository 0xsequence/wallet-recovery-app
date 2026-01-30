import { Navigate, Route, HashRouter as Router, Routes } from 'react-router-dom'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'

import GitHubCorner from '~/assets/GithubCorner'

import Landing from './Landing'
import Recovery from './Recovery'
import WalletV2Recovery from './WalletV2Recovery'
import WalletV3Recovery from './WalletV3Recovery'
import { WalletRecoveryProvider } from '~/components/provider/WalletRecoveryProvider'
import { useCreateWalletRecoveryContext } from '~/hooks/wallet-recovery-context'
import { Box, Spinner } from '@0xsequence/design-system'

export const AppRouter = () => {
  const authStore = useStore(AuthStore)
  const hasAccount = useObservable(authStore.accountAddress)
  const isLoadingAccount = useObservable(authStore.isLoadingAccount)
  const value = useCreateWalletRecoveryContext()

  if (isLoadingAccount) {
    return <Box display="flex" justifyContent="center" alignItems="center" height="vh" width="vw" >
      <Spinner size="lg" />
    </Box>
  }

  return (
    <WalletRecoveryProvider value={value}>
      <Router basename={'/'}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="recovery"
            element={<Recovery />}
          />
          <Route path="wallet-v2-recovery" element={hasAccount ? <WalletV2Recovery /> : <Navigate replace to="/" />} />
          <Route path="wallet-v3-recovery" element={hasAccount ? <WalletV3Recovery /> : <Navigate replace to="/" />} />
        </Routes>
        <GitHubCorner />
      </Router>
    </WalletRecoveryProvider>
  )
}
