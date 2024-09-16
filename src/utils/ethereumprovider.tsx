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
    console.log('Fetching Last Wallet Connect Provider')
    async function initProvider() {
      const p = await createProvider(projectId, false)

      if (!lastConnectedWalletInfo || lastConnectedWalletInfo.name !== 'WalletConnect') {
        p.disconnect()
        setProvider(null)
      } else {
        p.enable()
        setProvider(p)
      }
    }

    initProvider()
  }, [projectId])

  return provider
}
