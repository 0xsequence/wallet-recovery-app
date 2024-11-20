import EthereumProvider from '@walletconnect/ethereum-provider'
import { useEffect, useState } from 'react'

import { WALLET_CONNECT_PROJECT_ID } from '~/constants/wallet-context'

import { useStore } from '~/stores'
import { WalletStore } from '~/stores/WalletStore'

export const getWalletConnectProviderDetail = (provider: EthereumProvider) => {
  return {
    info: {
      walletId: '',
      uuid: '',
      name: 'WalletConnect',
      icon: 'https://avatars.githubusercontent.com/u/37784886'
    },
    provider: provider
  }
}

export async function createProvider(showQr: boolean): Promise<EthereumProvider> {
  const provider = await EthereumProvider.init({
    projectId: WALLET_CONNECT_PROJECT_ID,
    showQrModal: showQr,
    optionalChains: [1],
    metadata: {
      name: 'Sequence Recovery Wallet External Wallet',
      description: '',
      url: 'TODO_CHANGE_LATER',
      icons: []
    }
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

      await p.enable()
      setProvider(p)
    }

    if (lastConnectedWalletInfo?.name === 'WalletConnect') {
      initProvider()
    }

    return () => {
      if (provider) {
        provider.disconnect()
      }
    }
  }, [])

  return provider
}
