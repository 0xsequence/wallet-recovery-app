import { createStore, EIP6963ProviderDetail } from 'mipd'
import { Address } from 'ox'
import { useCallback, useState, useSyncExternalStore } from 'react'

import { useTxHashesStore } from './use-tx-hash-store'
import { useStore } from '~/stores'
import { WalletStore } from '~/stores/WalletStore'

export function useExternalWallet() {
  const [recoveryPayload, setRecoveryPayload] = useState<{
    to: Address.Address
    data: `0x${string}`
  }>()

  const txHashes = useTxHashesStore()
  const walletStore = useStore(WalletStore)

  const store = createStore()
  const providers = useSyncExternalStore(store.subscribe, store.getProviders)

  const [provider, setProvider] = useState<EIP6963ProviderDetail | null>(
    providers.length === 0 ? providers?.[0] : null
  )

  const [isLoadingAddresses, setLoadingAddresses] = useState(false)
  function getWalletAddresses(selectedProvider: typeof provider) {
    if (!selectedProvider) return

    setLoadingAddresses(true)
    const accounts = selectedProvider.provider
      .request({
        method: 'eth_requestAccounts',
      })
      .finally(() => {
        setLoadingAddresses(false)
      })

    return { accounts, isLoading: isLoadingAddresses }
  }

  const sendRecoveryPayload = useCallback(
    async (
      to: `0x${string}`,
      data: `0x${string}`,
      chainId: number,
      recoveryPayloadId?: string
    ) => {
      const selectedProvider = walletStore.selectedExternalProvider.get()
      if (!selectedProvider) return

      if (recoveryPayloadId) {
        txHashes.add(recoveryPayloadId, chainId)
      }

      try {
        const accounts = await selectedProvider.provider.request({
          method: 'eth_requestAccounts',
        }) as string[]

        const sender = accounts?.[0]

        await selectedProvider.provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x' + chainId.toString(16) }],
        })

        const hash = await selectedProvider.provider.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: sender,
              to,
              value: '0x0',
              data,
            },
          ],
        }) as `0x${string}`
        if (hash && recoveryPayloadId) {
          txHashes.update(recoveryPayloadId, { hash, status: 'pending' })
        }
        return { id: recoveryPayloadId, hash }
      } catch (error: any) {
        if (recoveryPayloadId) {
          if (error.code === 4001) {
            txHashes.update(recoveryPayloadId, { status: 'cancelled' })
          } else if (error.code === 4902) {
            txHashes.update(recoveryPayloadId, { status: 'unknown_chain' })
          } else {
            txHashes.update(recoveryPayloadId, {
              status: 'error',
              code: String(error.code),
            })
          }
        }
      }
    },
    [walletStore]
  )

  return {
    providers,
    provider,
    setProvider,
    recoveryPayload,
    setRecoveryPayload,
    sendRecoveryPayload,
    getWalletAddresses,
  }
}
