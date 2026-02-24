import { useEffect } from 'react'
import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'
import { NetworkStore } from '~/stores/NetworkStore'
import { TokenStore } from '~/stores/TokenStore'
import { WalletStore } from '~/stores/WalletStore'
import { WalletConnectSignClientStore } from '~/stores/WalletConnectSignClientStore'

/**
 * Consolidates all store subscriptions and observables for WalletV2Recovery
 */
export function useWalletV2State() {
  const authStore = useStore(AuthStore)
  const tokenStore = useStore(TokenStore)
  const walletStore = useStore(WalletStore)
  const networkStore = useStore(NetworkStore)
  const walletConnectSignClientStore = useStore(WalletConnectSignClientStore)

  const accountAddress = useObservable(authStore.accountAddress)
  const isSigningTxn = useObservable(walletStore.isSigningTxn)
  const isSigningMsg = useObservable(walletStore.isSigningMsg)
  const isNetworkModalOpen = useObservable(walletStore.isNetworkModalOpen)
  const networks = useObservable(networkStore.networks)

  // Load balances when account address or networks change
  useEffect(() => {
    if (accountAddress && networks.length > 0) {
      tokenStore.loadBalances(accountAddress, networks)
    }
  }, [accountAddress, networks, tokenStore])

  return {
    stores: {
      authStore,
      tokenStore,
      walletStore,
      networkStore,
      walletConnectSignClientStore
    },
    state: {
      accountAddress,
      isSigningTxn,
      isSigningMsg,
      isNetworkModalOpen,
      networks
    }
  }
}
