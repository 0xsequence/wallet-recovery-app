import { NetworkType } from '@0xsequence/network'
import { Address, parseAbi } from 'viem'

import { makeRpcClient } from '~/utils/rpcClient'

import type { QueuedRecoveryPayload } from '~/types/recovery'

import { findRecoverySigner } from '~/hooks/use-validate-signer'

import { networks } from '~/networks'
import { resolveQueuedPayloadsFromTransactionInputs } from '~/recovery-queue'

import { Store, observable } from '.'
import { AuthStore } from './AuthStore'

const RECOVERY_EXTENSION_ABI = parseAbi([
  'function totalQueuedPayloads(address wallet, address signer) view returns (uint256)',
  'function queuedPayloadHashes(address wallet, address signer, uint256 index) view returns (bytes32)',
  'function timestampForQueuedPayload(address wallet, address signer, bytes32 payloadHash) view returns (uint256)'
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
  error = observable<string | undefined>(undefined)

  private mainnetNetworks = networks.filter(network => network.type === NetworkType.MAINNET)
  private chains = this.mainnetNetworks

  private requestId = 0
  private unsubscribe: () => void

  constructor(private store: Store) {
    const authStore = this.store.get(AuthStore)
    this.unsubscribe = authStore.accountAddress.subscribe(address => {
      if (address) {
        this.fetchPayloads()
      } else {
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
    const authStore = this.store.get(AuthStore)
    const signerAddress = authStore.recoverySignerAddress.get() as Address | undefined
    if (!signerAddress) {
      return undefined
    }

    try {
      const match = await findRecoverySigner(wallet, signerAddress)
      return {
        wallet,
        signer: signerAddress,
        extension: match.extensionAddress,
        requiredDeltaTime: match.leaf.requiredDeltaTime
      }
    } catch (error) {
      console.error('Error resolving recovery context for queued payloads:', error)
      return undefined
    }
  }

  private async fetchPayloads() {
    const requestId = ++this.requestId
    this.isLoading.set(true)
    this.error.set(undefined)
    // A refresh must re-read the signed configuration: migrating recovery
    // modules does not change the wallet address or the recovery signer.
    this.payloads.set([])
    const authStore = this.store.get(AuthStore)
    const accountAddress = authStore.accountAddress.get() as Address | undefined

    if (!accountAddress || this.chains.length === 0) {
      this.isLoading.set(false)
      return
    }

    const context = await this.ensureRecoveryContext(accountAddress)
    if (requestId !== this.requestId) {
      return
    }
    if (!context) {
      this.error.set('Unable to load the recovery configuration. Refresh to retry.')
      this.isLoading.set(false)
      return
    }

    const fetchPromises = this.chains.map(network =>
      this.fetchPayloadsForChain(context, network.chainId, network.rpcUrl)
    )

    try {
      const results = await Promise.allSettled(fetchPromises)

      const allPayloads = results
        .filter(
          (result): result is PromiseFulfilledResult<QueuedRecoveryPayload[]> => result.status === 'fulfilled'
        )
        .flatMap(result => result.value)

      if (requestId === this.requestId) {
        this.payloads.set(allPayloads)
        if (results.some(result => result.status === 'rejected')) {
          this.error.set('Some networks could not be checked. Refresh to retry.')
        }
      }
    } catch (error) {
      console.error('Error fetching queued payloads:', error)
    } finally {
      if (requestId === this.requestId) {
        this.isLoading.set(false)
      }
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
      const client = makeRpcClient(rpcUrl)

      const total = await client.readContract({
        address: context.extension,
        abi: RECOVERY_EXTENSION_ABI,
        functionName: 'totalQueuedPayloads',
        args: [context.wallet, context.signer]
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
            args: [context.wallet, context.signer, index]
          })

          const timestamp = await client.readContract({
            address: context.extension,
            abi: RECOVERY_EXTENSION_ABI,
            functionName: 'timestampForQueuedPayload',
            args: [context.wallet, context.signer, payloadHash]
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
          queuedAt: timestamp
        }))
      })

      const results: QueuedRecoveryPayload[] = queuedPayloadMetadata.map(metadata => {
        const payload = decodedPayloads.get(metadata.payloadHash.toLowerCase())
        const id = `${context.extension}-${metadata.index}-${context.signer}-${chainId}-${context.wallet}`

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
          payload
        }
      })

      return results
    } catch (error) {
      console.error(`Error fetching payloads for chain ${chainId}:`, error)
      throw error
    }
  }

  refetch = () => {
    this.fetchPayloads()
  }

  clear() {
    ++this.requestId
    this.payloads.set([])
    this.error.set(undefined)
    this.isLoading.set(false)
  }

  destroyStore() {
    this.unsubscribe()
    this.clear()
  }
}
