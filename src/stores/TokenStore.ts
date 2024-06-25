import { ContractType, TokenBalance } from '@0xsequence/indexer'
import { NetworkConfig } from '@0xsequence/network'
import { ethers } from 'ethers'

import { subscribeImmediately } from '~/utils/observable'

import { NATIVE_TOKEN_ADDRESS } from '~/constants/address'

import { Store, observable } from '.'
import { AuthStore } from './AuthStore'
import { NetworkStore } from './NetworkStore'

export class TokenStore {
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
    networks.forEach(async network => {
      if (!network.rpcUrl) {
        console.warn(`No RPC URL found for network ${network.name}`)
        return
      }
      const provider = new ethers.providers.JsonRpcProvider(network.rpcUrl)
      const balance = await provider.getBalance(account)
      console.log('Balance', balance.toString(), network.name)
      const update = this.balances.get()
      update.push({
        contractType: ContractType.NATIVE,
        contractAddress: NATIVE_TOKEN_ADDRESS,
        tokenID: ethers.constants.AddressZero,
        accountAddress: account,
        balance: balance.toString(),
        chainId: network.chainId,
        blockHash: ethers.constants.HashZero, // TODO: prob not needed?
        blockNumber: 0 // TODO: prob not needed?

        // contractInfo: ({ })
        // tokenMetadata?: TokenMetadata;
      })
    })
  }
}
