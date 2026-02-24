import { useEffect } from 'react'
import { Route, HashRouter as Router, Routes, useLocation, useNavigate } from 'react-router-dom'

import { NAVIGATION_KEY } from '~/constants/storage'

import { useCreateWalletRecoveryContext } from '~/hooks/wallet-recovery-context'

import { WalletRecoveryProvider } from '~/components/provider/WalletRecoveryProvider'

import GitHubCorner from '~/assets/GithubCorner'

import Landing from './Landing'
import Recovery from './Recovery'
import WalletV2Recovery from './WalletV2Recovery'
import WalletV3Recovery from './WalletV3Recovery'

const RouterContent = () => {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Check if we should redirect to recovery page
    // This happens when state was cleared on refresh
    const shouldRedirect = sessionStorage.getItem(`${NAVIGATION_KEY}-redirect`)

    if (shouldRedirect === 'true') {
      sessionStorage.removeItem(`${NAVIGATION_KEY}-redirect`)
      if (location.pathname !== '/recovery') {
        navigate('/recovery', { replace: true })
      }
    }

    // Set up beforeunload to clear the navigation key when user refreshes
    const handleBeforeUnload = () => {
      sessionStorage.removeItem(NAVIGATION_KEY)
    }

    sessionStorage.setItem(NAVIGATION_KEY, 'active')

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [navigate, location.pathname])

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="recovery" element={<Recovery />} />
        <Route path="wallet-v2-recovery" element={<WalletV2Recovery />} />
        <Route path="wallet-v3-recovery" element={<WalletV3Recovery />} />
      </Routes>
      <GitHubCorner />
    </>
  )
}

export const AppRouter = () => {
  const value = useCreateWalletRecoveryContext()

  return (
    <WalletRecoveryProvider value={value}>
      <Router basename={'/'}>
        <RouterContent />
      </Router>
    </WalletRecoveryProvider>
  )
}
