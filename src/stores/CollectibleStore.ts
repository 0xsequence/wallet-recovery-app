import { ContractType } from '@0xsequence/indexer'
import { NetworkConfig } from '@0xsequence/network'
import { ethers } from 'ethers'

import { subscribeImmediately } from '~/utils/observable'

import { ERC721_ABI, ERC1155_ABI } from '~/constants/abi'

import { Store, observable } from '.'
import { AuthStore } from './AuthStore'
import { NetworkStore } from './NetworkStore'

export type CollectibleContractType = ContractType.ERC721 | ContractType.ERC1155

export type CollectibleInfoParams = {
  chainId: number
  address: string
  tokenId: number
  contractType: CollectibleContractType
}

export type CollectibleInfoResponse = {
  isOwner: boolean
  uri: string
  image?: string
  name?: string
  balance?: BigInt
  decimals?: number
}

export class CollectibleStore {
  isFetchingCollectibleInfo = observable(false)

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

  async getCollectibleInfo(params: CollectibleInfoParams): Promise<CollectibleInfoResponse> {
    const accountAddress = this.store.get(AuthStore).accountAddress.get()

    if (!accountAddress) {
      throw new Error('No account found')
    }

    const network = this.store.get(NetworkStore).networkForChainId(params.chainId)

    if (!network) {
      throw new Error(`No network found for chainId ${params.chainId}`)
    }

    if (!network.rpcUrl) {
      throw new Error(`No RPC URL found for network ${network.name}`)
    }

    this.isFetchingCollectibleInfo.set(true)

    const provider = new ethers.JsonRpcProvider(network.rpcUrl)

    let uri: string | undefined
    let image: string | undefined
    let name: string | undefined
    let balance: BigInt | undefined
    let decimals: number | undefined

    if (params.contractType === ContractType.ERC721) {
      const contract = new ethers.Contract(params.address, ERC721_ABI, provider)
      const owner = await contract.ownerOf(params.tokenId)
      const isOwner = owner.toLowerCase() === accountAddress.toLowerCase()

      if (!isOwner) {
        this.isFetchingCollectibleInfo.set(false)
        return { isOwner, uri: '' }
      }

      uri = await contract.tokenURI(params.tokenId)
    } else if (params.contractType === ContractType.ERC1155) {
      const contract = new ethers.Contract(params.address, ERC1155_ABI, provider)
      balance = await contract.balanceOf(accountAddress, params.tokenId)

      console.log(balance)

      if (!balance) {
        this.isFetchingCollectibleInfo.set(false)
        return { isOwner: false, uri: '' }
      }

      uri = await contract.uri(params.tokenId)
    }

    if (!uri) {
      throw new Error('Could not get collectible URI')
    }

    if (uri.startsWith('ipfs://')) {
      uri = uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
    }

    const metadata = await fetch(uri).then(res => res.json())

    if (metadata) {
      decimals = metadata.decimals
      image = metadata.image
      name = metadata.name
    }

    if (image?.startsWith('ipfs://')) {
      image = image.replace('ipfs://', 'https://ipfs.io/ipfs/')
    }

    this.isFetchingCollectibleInfo.set(false)

    return { isOwner: true, uri, image, name, balance, decimals }
  }

  async addUserCollectible(params: CollectibleInfoParams, response: CollectibleInfoResponse) {
    // const network = this.store.get(NetworkStore).networkForChainId(info.chainId)
    // if (!network) {
    //   throw new Error(`No network found for chainId ${info.chainId}`)
    // }
    // if (!network.rpcUrl) {
    //   throw new Error(`No RPC URL found for network ${network.name}`)
    // }
    // const provider = new ethers.JsonRpcProvider(network.rpcUrl)
    // const erc721 = new ethers.Contract(info.address, ERC721_ABI, provider)
    // const owner = await erc721.ownerOf(info.tokenId)
    // console.log(owner)
  }
}
