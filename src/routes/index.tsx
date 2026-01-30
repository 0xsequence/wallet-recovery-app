import { Route, HashRouter as Router, Routes } from 'react-router-dom'

import GitHubCorner from '~/assets/GithubCorner'

import Landing from './Landing'
import Recovery from './Recovery'
import WalletV2Recovery from './WalletV2Recovery'
import WalletV3Recovery from './WalletV3Recovery'
import { WalletRecoveryProvider } from '~/components/provider/WalletRecoveryProvider'
import { useCreateWalletRecoveryContext } from '~/hooks/wallet-recovery-context'

export const AppRouter = () => {
  const value = useCreateWalletRecoveryContext()

  return (
    <WalletRecoveryProvider value={value}>
      <Router basename={'/'}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="recovery"
            element={<Recovery />}
          />
          <Route path="wallet-v2-recovery" element={<WalletV2Recovery />} />
          <Route path="wallet-v3-recovery" element={<WalletV3Recovery />} />
        </Routes>
        <GitHubCorner />
      </Router>
    </WalletRecoveryProvider>
  )
}
