import { useEffect } from 'react'
import { useStore } from '~/stores'
import { WalletStore } from '~/stores/WalletStore'
import { useSyncProviders } from '~/hooks/useSyncProviders'
import { useWalletConnectProvider, getWalletConnectProviderDetail } from '~/utils/ethereumprovider'

/**
 * Hook to sync external providers (WalletConnect and browser wallets)
 * with the WalletStore
 */
export function useExternalProviderSync() {
  const walletStore = useStore(WalletStore)
  const externalProviders = useSyncProviders()
  const walletConnectProvider = useWalletConnectProvider()

  // Sync WalletConnect provider
  useEffect(() => {
    if (
      walletConnectProvider &&
      walletConnectProvider.connected &&
      !walletStore.selectedExternalProvider.get()
    ) {
      const walletConnectProviderDetail = getWalletConnectProviderDetail(walletConnectProvider)
      const availableProviders = walletStore.availableExternalProviders.get()

      if (availableProviders) {
        walletStore.availableExternalProviders.set([walletConnectProviderDetail, ...availableProviders])
      } else {
        walletStore.availableExternalProviders.set([walletConnectProviderDetail])
      }
    }
  }, [walletConnectProvider, walletStore])

  // Sync browser extension providers
  useEffect(() => {
    if (externalProviders.length > 0) {
      walletStore.availableExternalProviders.set(externalProviders)
    }
  }, [externalProviders, walletStore])
}
