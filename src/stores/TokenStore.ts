import { ContractType, TokenBalance } from '@0xsequence/indexer'
import { NetworkConfig, NetworkType, getChainId } from '@0xsequence/network'
import { ethers } from 'ethers'

import { getNativeTokenInfo } from '~/utils/network'
import { subscribeImmediately } from '~/utils/observable'

import { Store, observable } from '.'
import { AuthStore } from './AuthStore'
import { NetworkStore } from './NetworkStore'

export class TokenStore {
  isFetchingBalances = observable(false)

  balances = observable<TokenBalance[]>([])

  constructor(private store: Store) {
    const networkStore = this.store.get(NetworkStore)
    const authStore = this.store.get(AuthStore)

    subscribeImmediately(authStore.accountAddress, address => {
      if (address) {
        const networks = networkStore.networks.get()
        this.loadBalances(address, networks)
      }
    })
  }

  private async loadBalances(account: string, networks: NetworkConfig[]) {
    const mainnets = networks.filter(network => network.type === NetworkType.MAINNET)
    const update = this.balances.get()

    this.isFetchingBalances.set(true)

    await Promise.allSettled(
      mainnets.map(async network => {
        if (!network.rpcUrl) {
          console.warn(`No RPC URL found for network ${network.name}`)
          return
        }
        const provider = new ethers.providers.JsonRpcProvider(network.rpcUrl)
        try {
          const balance = await provider.getBalance(account)

          update.push({
            contractType: ContractType.NATIVE,
            contractAddress: ethers.constants.AddressZero,
            tokenID: '',
            accountAddress: account,
            balance: balance.toString(),
            chainId: network.chainId,
            blockHash: ethers.constants.HashZero, // TODO: prob not needed?
            blockNumber: 0, // TODO: prob not needed?
            contractInfo: getNativeTokenInfo(getChainId(network.chainId))
            // tokenMetadata?: TokenMetadata;
          })
        } catch (err) {
          console.error(err)
        }
      })
    )

    this.balances.set(update)
    this.isFetchingBalances.set(false)
  }
}
