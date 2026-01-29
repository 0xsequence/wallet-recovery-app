import { compareAddress } from '@0xsequence/design-system'
import { Sequence } from '@0xsequence/wallet-wdk'
import { NetworkType } from '@0xsequence/network'
import { Address } from 'viem'

import { manager } from '~/manager'
import { networks } from '~/networks'

import { Store, observable } from '.'
import { AuthStore } from './AuthStore'

export class QueuedPayloadsStore {
  isLoading = observable(true)
  payloads = observable<Sequence.QueuedRecoveryPayload[]>([])

  private mainnetNetworks = networks.filter(network => network.type === NetworkType.MAINNET)
  private chains = this.mainnetNetworks.map(network => network.chainId)

  constructor(private store: Store) {
    // Subscribe to auth store changes
    const authStore = this.store.get(AuthStore)
    authStore.accountAddress.subscribe(address => {
      if (address) {
        this.fetchPayloads()
      } else {
        this.clear()
      }
    })

    // Initial fetch if account is already loaded
    const accountAddress = authStore.accountAddress.get()
    if (accountAddress) {
      this.fetchPayloads()
    } else {
      this.isLoading.set(false)
    }
  }

  private async fetchPayloads() {
    this.isLoading.set(true)
    const authStore = this.store.get(AuthStore)
    const accountAddress = authStore.accountAddress.get() as Address | undefined

    if (!this.chains || !accountAddress) {
      this.isLoading.set(false)
      return
    }

    // Clear existing payloads for this address
    this.clearPayloadsForAddress(accountAddress)

    const fetchPromises = this.chains.map(chain => 
      this.fetchPayloadsForChain(accountAddress, chain)
    )

    try {
      const results = await Promise.allSettled(fetchPromises)
      
      // Combine all successful results
      const allPayloads = results
        .filter((result): result is PromiseFulfilledResult<Sequence.QueuedRecoveryPayload[]> => 
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
    address: Address, 
    chain: number
  ): Promise<Sequence.QueuedRecoveryPayload[]> {
    try {
      // @ts-expect-error fetchQueuedPayloads takes, but doesn't expect chain
      return await manager.recovery.fetchQueuedPayloads(address, chain)
    } catch (error) {
      console.error(`Error fetching payloads for chain ${chain}:`, error)
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

  private addPayloads(newPayloads: Sequence.QueuedRecoveryPayload[]) {
    if (newPayloads.length === 0) {return}

    const current = this.payloads.get()
    const merged = [...current, ...newPayloads]
    
    // Remove duplicates based on payload id
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
