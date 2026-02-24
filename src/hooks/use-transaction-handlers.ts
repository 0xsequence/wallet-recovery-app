import { useToast } from '@0xsequence/design-system'
import { TokenBalance } from '@0xsequence/indexer'
import { useCallback } from 'react'
import { CollectibleInfo } from '~/stores/CollectibleStore'
import { NetworkStore } from '~/stores/NetworkStore'
import { TokenStore } from '~/stores/TokenStore'
import { WalletStore } from '~/stores/WalletStore'
import { getTransactionReceipt } from '~/utils/receipt'

/**
 * Handles token and collectible transaction sending logic
 */
export function useTransactionHandlers(
  walletStore: WalletStore,
  tokenStore: TokenStore,
  networkStore: NetworkStore
) {
  const toast = useToast()

  const handleSendToken = useCallback(
    async (tokenBalance: TokenBalance, to: string, amount: string) => {
      if (!walletStore.selectedExternalProvider.get()) {
        console.warn('No external provider selected')
        return
      }

      let response: { hash: string } | undefined
      try {
        response = await walletStore.sendToken(tokenBalance, to, amount)
      } catch (error) {
        if ((error as any).code === 4001) {
          toast({
            variant: 'error',
            title: 'User denied transaction signature.'
          })
        }
        console.error(error)
        throw error
      }

      const provider = networkStore.providerForChainId(tokenBalance.chainId)
      const receipt = await getTransactionReceipt(provider, response.hash)

      if (receipt) {
        toast({
          variant: 'success',
          title: 'Transaction confirmed',
          description: 'You can view the transaction details on your connected external wallet'
        })
      }

      tokenStore.updateTokenBalance(tokenBalance)
      walletStore.isSendingTokenTransaction.set(undefined)

      return response
    },
    [walletStore, tokenStore, networkStore, toast]
  )

  const handleSendCollectible = useCallback(
    async (collectibleInfo: CollectibleInfo, to: string, amount: string) => {
      if (!walletStore.selectedExternalProvider.get()) {
        console.warn('No external provider selected')
        return
      }

      let response: { hash: string } | undefined
      try {
        response = await walletStore.sendCollectible(collectibleInfo, to, amount)
      } catch (error) {
        if ((error as any).code === 4001) {
          toast({
            variant: 'error',
            title: 'User denied transaction signature.'
          })
        }
        console.error(error)
        throw error
      }

      const provider = networkStore.providerForChainId(collectibleInfo.collectibleInfoParams.chainId)
      const receipt = await getTransactionReceipt(provider, response.hash)

      if (receipt) {
        toast({
          variant: 'success',
          title: 'Transaction confirmed',
          description: 'You can view the transaction details on your connected external wallet'
        })
      }

      walletStore.isSendingCollectibleTransaction.set(undefined)

      return response
    },
    [walletStore, networkStore, toast]
  )

  const handlePendingSignTransaction = useCallback(
    async (hash: string, chainId: number) => {
      const rpcProvider = networkStore.providerForChainId(chainId)
      const receipt = await getTransactionReceipt(rpcProvider, hash)

      if (receipt) {
        walletStore.isSendingSignedTokenTransaction.set(undefined)

        toast({
          variant: 'success',
          title: 'Sign transaction confirmed',
          description: 'You can view the transaction details on your connected external wallet'
        })
      }
    },
    [walletStore, networkStore, toast]
  )

  return {
    handleSendToken,
    handleSendCollectible,
    handlePendingSignTransaction
  }
}
