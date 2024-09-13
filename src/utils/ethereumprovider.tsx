import EthereumProvider from '@walletconnect/ethereum-provider'
import { useObservable } from 'micro-observables'
import { useEffect, useMemo, useState } from 'react'

import { useStore } from '~/stores'
import { NetworkStore } from '~/stores/NetworkStore'
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

  const networkStore = useStore(NetworkStore)
  const networks = useObservable(networkStore.networks)
  const walletConnectChains = useMemo(() => networks.map(network => Number(network.chainId)), [networks])

  const walletStore = useStore(WalletStore)
  const lastConnectedWalletInfo = walletStore.getLastConnectedExternalProviderInfo()

  useEffect(() => {
    console.log('Fetching Last Wallet Connect Provider')
    async function initProvider() {
      const p = await createProvider(projectId, false)
      setProvider(p)

      p.enable()
      setProvider(p)
    }

    initProvider()
  }, [projectId])

  if (!lastConnectedWalletInfo) {
    return null
  }

  return provider
}
