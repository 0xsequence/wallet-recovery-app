import { ContractType } from '@0xsequence/indexer'
import { NetworkConfig } from '@0xsequence/network'
import { ethers } from 'ethers'

import { subscribeImmediately } from '~/utils/observable'

import { ERC721_ABI } from '~/constants/abi'

import { Store } from '.'
import { AuthStore } from './AuthStore'
import { NetworkStore } from './NetworkStore'

export type CollectibleContractType = ContractType.ERC721 | ContractType.ERC1155

type CollectibleInfo = {
  chainId: number
  address: string
  tokenId: number
  contractType: CollectibleContractType
}

export class CollectibleStore {
  constructor(private store: Store) {
    const networkStore = this.store.get(NetworkStore)

    subscribeImmediately(networkStore.networks, networks => {
      const accountAddress = this.store.get(AuthStore).accountAddress.get()
      if (accountAddress && networks.length > 0) {
        this.loadBalances(accountAddress, networks)
      }
    })
  }

  private async loadBalances(account: string, networks: NetworkConfig[]) {}

  async addUserCollectible(info: CollectibleInfo) {
    const network = this.store.get(NetworkStore).networkForChainId(info.chainId)

    if (!network) {
      throw new Error(`No network found for chainId ${info.chainId}`)
    }

    if (!network.rpcUrl) {
      throw new Error(`No RPC URL found for network ${network.name}`)
    }

    const provider = new ethers.JsonRpcProvider(network.rpcUrl)
    const erc721 = new ethers.Contract(info.address, ERC721_ABI, provider)

    const owner = await erc721.ownerOf(info.tokenId)

    console.log(owner)
  }
}
