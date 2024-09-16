import EthereumProvider from '@walletconnect/ethereum-provider'
import { useEffect, useState } from 'react'

import { useStore } from '~/stores'
import { WalletStore } from '~/stores/WalletStore'

export async function createProvider(projectId: string, showQr: boolean): Promise<EthereumProvider> {
  const provider = await EthereumProvider.init({
    projectId: projectId,
    showQrModal: showQr,
    optionalChains: [1]
  })

  return provider
}

export function useWalletConnectProvider(projectId: string) {
  const [provider, setProvider] = useState<EthereumProvider | null>(null)

  const walletStore = useStore(WalletStore)
  const lastConnectedWalletInfo = walletStore.getLastConnectedExternalProviderInfo()

  useEffect(() => {
    async function initProvider() {
      const p = await createProvider(projectId, false)

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
  }, [projectId])

  return provider
}
