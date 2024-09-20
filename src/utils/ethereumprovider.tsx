import EthereumProvider from '@walletconnect/ethereum-provider'
import { useEffect, useState } from 'react'

import { WALLET_CONNECT_PROJECT_ID } from '~/constants/wallet-context'

import { useStore } from '~/stores'
import { WalletStore } from '~/stores/WalletStore'

export async function createProvider(showQr: boolean): Promise<EthereumProvider> {
  const provider = await EthereumProvider.init({
    projectId: WALLET_CONNECT_PROJECT_ID,
    showQrModal: showQr,
    optionalChains: [1]
  })

  return provider
}

export function useWalletConnectProvider() {
  const [provider, setProvider] = useState<EthereumProvider | null>(null)

  const walletStore = useStore(WalletStore)
  const lastConnectedWalletInfo = walletStore.getLastConnectedExternalProviderInfo()

  useEffect(() => {
    async function initProvider() {
      const p = await createProvider(false)

      p.enable()
      setProvider(p)

      return () => {
        if (provider) {
          provider.disconnect()
        }
      }
    }

    if (lastConnectedWalletInfo?.name === 'WalletConnect') {
      initProvider()
    }
  }, [])

  return provider
}
