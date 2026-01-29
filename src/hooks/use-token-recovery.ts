import { TokenBalance, ResourceStatus } from '@0xsequence/indexer'
import { ethers } from 'ethers'
import { useStore, useObservable } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'
import { WalletStore } from '~/stores/WalletStore'
import { CollectibleInfo } from '~/stores/CollectibleStore'
import { useCreateCalls } from '~/hooks/use-create-calls'
import { createTokenRecord } from '~/utils/token-record-factory'

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

    // Convert CollectibleInfo to TokenBalance format. TODO: Do this in a better way.
    const collectibleAsTokenBalance: TokenBalance = {
      accountAddress: accountAddress,
      blockHash: '',
      blockNumber: 0,
      chainId: collectible.collectibleInfoParams.chainId,
      contractAddress: collectible.collectibleInfoParams.address,
      contractType: collectible.collectibleInfoParams.contractType as any,
      tokenID: collectible.collectibleInfoParams.tokenId.toString(),
      balance: collectible.collectibleInfoResponse.balance?.toString() ?? '1',
      uniqueCollectibles: collectible.collectibleInfoParams.tokenId.toString(),
      isSummary: false,
      contractInfo: {
        chainId: collectible.collectibleInfoParams.chainId,
        address: collectible.collectibleInfoParams.address,
        name: collectible.collectibleInfoResponse.name ?? 'Unknown',
        type: collectible.collectibleInfoParams.contractType as any,
        symbol: collectible.collectibleInfoResponse.name ?? '',
        decimals: collectible.collectibleInfoResponse.decimals ?? 0,
        logoURI: collectible.collectibleInfoResponse.image ?? '',
        source: '',
        deployed: true,
        bytecodeHash: '',
        updatedAt: new Date().toISOString(),
        status: ResourceStatus.AVAILABLE,
        extensions: {
          link: '',
          description: '',
          ogImage: '',
          originChainId: 0,
          originAddress: '',
          blacklist: false,
          verified: false,
          verifiedBy: '',
          categories: [],
          ogName: '',
          featured: false,
          featureIndex: 0
        }
      },
      tokenMetadata: {
        tokenId: collectible.collectibleInfoParams.tokenId.toString(),
        contractAddress: collectible.collectibleInfoParams.address,
        name: collectible.collectibleInfoResponse.name ?? 'Unknown',
        description: '',
        image: collectible.collectibleInfoResponse.image ?? '',
        decimals: collectible.collectibleInfoResponse.decimals ?? 0,
        properties: {},
        source: '',
        attributes: [],
        status: ResourceStatus.AVAILABLE
      }
    }

    const tokenRecord = createTokenRecord(collectibleAsTokenBalance)

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
