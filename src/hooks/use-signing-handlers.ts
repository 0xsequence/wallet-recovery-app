import { useToast } from '@0xsequence/design-system'
import { ConnectOptions, MessageToSign } from '@0xsequence/provider'
import { ethers } from 'ethers'
import { useCallback } from 'react'
import { AuthStore } from '~/stores/AuthStore'
import { WalletStore } from '~/stores/WalletStore'
import { WalletConnectSignClientStore } from '~/stores/WalletConnectSignClientStore'

/**
 * Handles message and transaction signing logic for WalletConnect
 */
export function useSigningHandlers(
  authStore: AuthStore,
  walletStore: WalletStore,
  walletConnectSignClientStore: WalletConnectSignClientStore,
  onPendingSignTransaction: (hash: string, chainId: number) => Promise<void>
) {
  const toast = useToast()

  const cancelRequest = useCallback(() => {
    walletStore.resetSignObservables()
    walletConnectSignClientStore.rejectRequest()
    walletStore.toSignPermission.set('cancelled')
  }, [walletStore, walletConnectSignClientStore])

  const handleSignTransaction = useCallback(
    async (details: {
      txn: ethers.Transaction[] | ethers.TransactionRequest[]
      chainId?: number
      origin?: string
      projectAccessKey?: string
    }) => {
      const provider = walletStore.selectedExternalProvider.get()?.provider
      const account = authStore.account

      if (!provider || !account) {
        throw new Error('No provider or account found')
      }

      try {
        walletStore.isSendingSignedTokenTransaction.set(details)

        const providerAddress = await walletStore.getExternalProviderAddress(provider)

        if (!providerAddress) {
          throw new Error('No provider address found')
        }

        const response = await walletStore.sendTransaction(
          account,
          provider,
          providerAddress,
          details.txn,
          details.chainId!
        )

        await onPendingSignTransaction(response.hash, details.chainId!)

        walletStore.toSignResult.set(response)
        walletStore.toSignPermission.set('approved')
        walletStore.isSigningTxn.set(false)
      } catch (error) {
        toast({
          variant: 'error',
          title: 'Transaction failed',
          description: 'Please try again.'
        })
        walletStore.isSendingSignedTokenTransaction.set(undefined)
        cancelRequest()
        throw error
      }
    },
    [authStore, walletStore, onPendingSignTransaction, toast, cancelRequest]
  )

  const handleSignMessage = useCallback(
    async (details: {
      message: MessageToSign
      chainId: number
      options?: ConnectOptions
    }) => {
      const account = authStore.account

      if (!account) {
        throw new Error('No account found')
      }

      try {
        let hash: string | undefined

        if (details.message.message) {
          hash = await account.signMessage(
            details.message.message,
            details.message.chainId!,
            details.message.eip6492 ? 'eip6492' : 'throw'
          )
        } else if (details.message.typedData) {
          const typedData = details.message.typedData
          hash = await account.signTypedData(
            typedData.domain,
            typedData.types,
            typedData.message,
            details.message.chainId!,
            details.message.eip6492 ? 'eip6492' : 'throw'
          )
        }

        if (!hash) {
          throw new Error('Account sign method failed')
        }

        walletStore.toSignResult.set({ hash })
        walletStore.toSignPermission.set('approved')
      } catch (error) {
        toast({
          variant: 'error',
          title: 'Transaction failed',
          description: 'Please try again.'
        })
        walletStore.isSendingSignedTokenTransaction.set(undefined)
        cancelRequest()
        throw error
      }
    },
    [authStore, walletStore, toast, cancelRequest]
  )

  return {
    handleSignTransaction,
    handleSignMessage,
    cancelRequest
  }
}
