import { useToast } from '@0xsequence/design-system'
import { ConnectOptions, MessageToSign } from '@0xsequence/provider'
import { ethers } from 'ethers'
import { useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'
import { NetworkStore } from '~/stores/NetworkStore'
import { WalletStore } from '~/stores/WalletStore'
import { WalletConnectSignClientStore } from '~/stores/WalletConnectSignClientStore'
import { getTransactionReceipt } from '~/utils/receipt'

/**
 * Hook to handle transaction and message signing operations
 */
export function useTransactionSigning() {
  const authStore = useStore(AuthStore)
  const walletStore = useStore(WalletStore)
  const networkStore = useStore(NetworkStore)
  const walletConnectSignClientStore = useStore(WalletConnectSignClientStore)
  const toast = useToast()

  const cancelRequest = () => {
    walletStore.resetSignObservables()
    walletConnectSignClientStore.rejectRequest()
    walletStore.toSignPermission.set('cancelled')
  }

  const handlePendingSignTransaction = async (hash: string, chainId: number) => {
    const rpcProvider = networkStore.providerForChainId(chainId)
    const receipt = await getTransactionReceipt(rpcProvider, hash)

    if (receipt) {
      walletStore.isSendingSignedTokenTransaction.set(undefined)

      toast({
        variant: 'success',
        title: 'Sign transaction confirmed',
        description: `You can view the transaction details on your connected external wallet`
      })
    }
  }

  const handleSignTxn = async (details: {
    txn: ethers.Transaction[] | ethers.TransactionRequest[]
    chainId?: number
    origin?: string
    projectAccessKey?: string
  }) => {
    const signTransaction = async (
      txn: ethers.Transaction[] | ethers.TransactionRequest[],
      chainId?: number
    ): Promise<{ hash: string }> => {
      try {
        const provider = walletStore.selectedExternalProvider.get()?.provider
        const providerAddress = await walletStore.getExternalProviderAddress(provider!)

        if (!providerAddress) {
          throw new Error('No provider address found')
        }

        const response = await walletStore.sendTransaction(
          authStore.account!,
          provider!,
          providerAddress,
          txn,
          chainId!
        )

        return response
      } catch (error) {
        walletStore.isSendingSignedTokenTransaction.set(undefined)
        throw error
      }
    }

    let result: { hash: string } | undefined

    if (details) {
      try {
        walletStore.isSendingSignedTokenTransaction.set(details)
        result = await signTransaction(details.txn, details.chainId)
        handlePendingSignTransaction(result.hash, details.chainId!)

        walletStore.toSignResult.set(result)
        walletStore.toSignPermission.set('approved')
        walletStore.isSigningTxn.set(false)
      } catch (error) {
        toast({
          variant: 'error',
          title: 'Transaction failed',
          description: `Please try again.`
        })
        walletStore.isSendingSignedTokenTransaction.set(undefined)
        cancelRequest()
        throw error
      }
    }
  }

  const handleSignMsg = async (details: {
    message: MessageToSign
    chainId: number
    options?: ConnectOptions
  }) => {
    const signMessage = async (msg: MessageToSign, _options?: ConnectOptions): Promise<{ hash: string }> => {
      try {
        let hash: string | undefined
        const account = authStore.account

        if (msg.message) {
          hash = await account!.signMessage(msg.message, msg.chainId!, msg.eip6492 ? 'eip6492' : 'throw')
        } else if (msg.typedData) {
          const typedData = msg.typedData
          hash = await account!.signTypedData(
            typedData.domain,
            typedData.types,
            typedData.message,
            msg.chainId!,
            msg.eip6492 ? 'eip6492' : 'throw'
          )
        }

        if (!hash) {
          throw new Error('Account sign method failed')
        }

        return { hash }
      } catch (error) {
        throw error
      }
    }

    let result: { hash: string } | undefined

    if (details) {
      try {
        result = await signMessage(details.message)

        walletStore.toSignResult.set(result)
        walletStore.toSignPermission.set('approved')
      } catch (error) {
        toast({
          variant: 'error',
          title: 'Transaction failed',
          description: `Please try again.`
        })
        walletStore.isSendingSignedTokenTransaction.set(undefined)
        cancelRequest()
        throw error
      }
    }
  }

  return {
    handleSignTxn,
    handleSignMsg,
    cancelRequest
  }
}
