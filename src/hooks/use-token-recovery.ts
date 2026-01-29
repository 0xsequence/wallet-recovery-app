import { TokenBalance } from '@0xsequence/indexer'
import { ethers } from 'ethers'
import { Address } from 'viem'
import { useStore, useObservable } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'
import { WalletStore } from '~/stores/WalletStore'
import { CollectibleInfo } from '~/stores/CollectibleStore'
import { useCreateCalls } from '~/hooks/use-create-calls'
import { createTokenRecord, createTokenRecordFromCollectible } from '~/utils/token-record-factory'

/**
 * Hook to handle token and collectible recovery operations
 */
export function useTokenRecovery() {
  const authStore = useStore(AuthStore)
  const walletStore = useStore(WalletStore)
  const accountAddress = useObservable(authStore.accountAddress)
  const { createCalls } = useCreateCalls()

  const handleEnqueueTokenPayload = async (
    token: TokenBalance,
    amount?: string
  ): Promise<string | undefined> => {
    if (!walletStore.selectedExternalProvider.get()) {
      console.warn('No external provider selected')
      return undefined
    }

    if (!token) {
      return undefined
    }

    const tokenRecord = createTokenRecord(token)

    // Convert amount from human-readable format to smallest unit (wei)
    let amountInSmallestUnit: string | undefined
    if (amount) {
      const decimals = token.contractInfo?.decimals ?? 18
      const amountBigInt = ethers.parseUnits(amount, decimals)
      amountInSmallestUnit = amountBigInt.toString()
    }

    // Return the recoveryPayloadId so caller can track the transaction
    const recoveryPayloadId = await createCalls([tokenRecord], tokenRecord.chainId, amountInSmallestUnit)

    return recoveryPayloadId
  }

  const handleEnqueueCollectiblePayload = async (
    collectible: CollectibleInfo,
    amount?: string
  ): Promise<string | undefined> => {
    if (!walletStore.selectedExternalProvider.get()) {
      console.warn('No external provider selected')
      return undefined
    }

    if (!collectible || !accountAddress) {
      return undefined
    }

    // Convert CollectibleInfo to TokenRecord using the factory
    const tokenRecord = createTokenRecordFromCollectible(collectible, accountAddress as Address)

    let amountInSmallestUnit: string | undefined
    if (amount) {
      const decimals = collectible.collectibleInfoResponse.decimals ?? 0
      const amountBigInt = ethers.parseUnits(amount, decimals)
      amountInSmallestUnit = amountBigInt.toString()
    }

    const recoveryPayloadId = await createCalls([tokenRecord], tokenRecord.chainId, amountInSmallestUnit)

    return recoveryPayloadId
  }

  return {
    handleEnqueueTokenPayload,
    handleEnqueueCollectiblePayload
  }
}
