import compareAddress from '~/utils/compareAddress'
import { NetworkType } from '@0xsequence/network'
import { Address, createPublicClient, http, parseAbi, type PublicClient } from 'viem'

import { findRecoverySigner } from '~/hooks/use-validate-signer'
import { networks } from '~/networks'
import { resolveQueuedPayloadsFromTransactionInputs } from '~/recovery-queue'
import type { QueuedRecoveryPayload } from '~/types/recovery'

import { Store, observable } from '.'
import { AuthStore } from './AuthStore'

const RECOVERY_EXTENSION_ABI = parseAbi([
  'function totalQueuedPayloads(address wallet, address signer) view returns (uint256)',
  'function queuedPayloadHashes(address wallet, address signer, uint256 index) view returns (bytes32)',
  'function timestampForQueuedPayload(address wallet, address signer, bytes32 payloadHash) view returns (uint256)',
])

type RecoveryContext = {
  wallet: Address
  signer: Address
  extension: Address
  requiredDeltaTime: bigint
}

export class QueuedPayloadsStore {
  isLoading = observable(true)
  payloads = observable<QueuedRecoveryPayload[]>([])

  private mainnetNetworks = networks.filter(network => network.type === NetworkType.MAINNET)
  private chains = this.mainnetNetworks

  private recoveryContext: RecoveryContext | undefined

  constructor(private store: Store) {
    const authStore = this.store.get(AuthStore)
    authStore.accountAddress.subscribe(address => {
      if (address) {
        this.fetchPayloads()
      } else {
        this.recoveryContext = undefined
        this.clear()
      }
    })

    const accountAddress = authStore.accountAddress.get()
    if (accountAddress) {
      this.fetchPayloads()
    } else {
      this.isLoading.set(false)
    }
  }

  private async ensureRecoveryContext(wallet: Address): Promise<RecoveryContext | undefined> {
    if (this.recoveryContext && compareAddress(this.recoveryContext.wallet, wallet)) {
      return this.recoveryContext
    }

    const authStore = this.store.get(AuthStore)
    const signerAddress = authStore.recoverySignerAddress.get() as Address | undefined
    if (!signerAddress) {
      return undefined
    }

    try {
      const match = await findRecoverySigner(wallet, signerAddress)
      this.recoveryContext = {
        wallet,
        signer: signerAddress,
        extension: match.extensionAddress,
        requiredDeltaTime: match.leaf.requiredDeltaTime,
      }
      return this.recoveryContext
    } catch (error) {
      console.error('Error resolving recovery context for queued payloads:', error)
      return undefined
    }
  }

  private async fetchPayloads() {
    this.isLoading.set(true)
    const authStore = this.store.get(AuthStore)
    const accountAddress = authStore.accountAddress.get() as Address | undefined

    if (!accountAddress || this.chains.length === 0) {
      this.isLoading.set(false)
      return
    }

    this.clearPayloadsForAddress(accountAddress)

    const context = await this.ensureRecoveryContext(accountAddress)
    if (!context) {
      this.isLoading.set(false)
      return
    }

    const fetchPromises = this.chains.map(network =>
      this.fetchPayloadsForChain(context, network.chainId, network.rpcUrl)
    )

    try {
      const results = await Promise.allSettled(fetchPromises)

      const allPayloads = results
        .filter((result): result is PromiseFulfilledResult<QueuedRecoveryPayload[]> =>
          result.status === 'fulfilled'
        )
        .flatMap(result => result.value)

      this.addPayloads(allPayloads)
    } catch (error) {
      console.error('Error fetching queued payloads:', error)
    } finally {
      this.isLoading.set(false)
    }
  }

  private async fetchPayloadsForChain(
    context: RecoveryContext,
    chainId: number,
    rpcUrl: string
  ): Promise<QueuedRecoveryPayload[]> {
    if (!rpcUrl) {
      return []
    }

    try {
      const client: PublicClient = createPublicClient({ transport: http(rpcUrl, { retryCount: 1, timeout: 10_000 }) })

      const total = await client.readContract({
        address: context.extension,
        abi: RECOVERY_EXTENSION_ABI,
        functionName: 'totalQueuedPayloads',
        args: [context.wallet, context.signer],
      })

      if (total === 0n) {
        return []
      }

      const queuedPayloadMetadata = await Promise.all(
        Array.from({ length: Number(total) }, async (_, numericIndex) => {
          const index = BigInt(numericIndex)

          const payloadHash = await client.readContract({
            address: context.extension,
            abi: RECOVERY_EXTENSION_ABI,
            functionName: 'queuedPayloadHashes',
            args: [context.wallet, context.signer, index],
          })

          const timestamp = await client.readContract({
            address: context.extension,
            abi: RECOVERY_EXTENSION_ABI,
            functionName: 'timestampForQueuedPayload',
            args: [context.wallet, context.signer, payloadHash],
          })

          return { index, payloadHash, timestamp }
        })
      )
      const decodedPayloads = await resolveQueuedPayloadsFromTransactionInputs({
        client,
        extension: context.extension,
        wallet: context.wallet,
        signer: context.signer,
        chainId,
        payloads: queuedPayloadMetadata.map(({ payloadHash, timestamp }) => ({
          payloadHash,
          queuedAt: timestamp,
        })),
      })

      const results: QueuedRecoveryPayload[] = queuedPayloadMetadata.map(metadata => {
        const payload = decodedPayloads.get(metadata.payloadHash.toLowerCase())
        const id = `${metadata.index}-${context.signer}-${chainId}-${context.wallet}`

        return {
          id,
          index: metadata.index,
          recoveryModule: context.extension,
          wallet: context.wallet,
          signer: context.signer,
          chainId,
          startTimestamp: metadata.timestamp,
          endTimestamp: metadata.timestamp + context.requiredDeltaTime,
          payloadHash: metadata.payloadHash,
          payload,
        }
      })

      return results
    } catch (error) {
      console.error(`Error fetching payloads for chain ${chainId}:`, error)
      return []
    }
  }

  private clearPayloadsForAddress(address: Address) {
    const current = this.payloads.get()
    const filtered = current.filter(
      payload => !compareAddress(payload.wallet, address)
    )
    this.payloads.set(filtered)
  }

  private addPayloads(newPayloads: QueuedRecoveryPayload[]) {
    if (newPayloads.length === 0) {return}

    const current = this.payloads.get()
    const merged = [...current, ...newPayloads]

    const unique = [...new Map(merged.map(item => [item.id, item])).values()]

    this.payloads.set(unique)
  }

  refetch = () => {
    this.fetchPayloads()
  }

  clear() {
    this.payloads.set([])
    this.isLoading.set(false)
  }
}
