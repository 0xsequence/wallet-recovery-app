import { ContractType } from '@0xsequence/indexer'
import { NetworkConfig } from '@0xsequence/network'
import { ethers } from 'ethers'
import { c } from 'node_modules/vite/dist/node/types.d-aGj9QkWt'

import { getGatewayAddress } from '~/utils/gateways'
import { subscribeImmediately } from '~/utils/observable'

import { ERC721_ABI, ERC1155_ABI } from '~/constants/abi'
import { LocalStorageKey } from '~/constants/storage'

import { Store, observable } from '.'
import { AuthStore } from './AuthStore'
import { LocalStore } from './LocalStore'
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
  balance?: bigint
  decimals?: number
}

export type CollectibleInfo = {
  collectibleInfoParams: CollectibleInfoParams
  collectibleInfoResponse: CollectibleInfoResponse
}

export class CollectibleStore {
  isFetchingBalances = observable(false)
  isFetchingCollectibleInfo = observable(false)

  constructor(private store: Store) {
    const networkStore = this.store.get(NetworkStore)

    subscribeImmediately(networkStore.networks, networks => {
      const accountAddress = this.store.get(AuthStore).accountAddress.get()
      if (accountAddress && networks.length > 0) {
        this.loadBalances(accountAddress)
      }
    })
  }

  userCollectibles = observable<CollectibleInfo[]>([])

  private local = {
    userCollectibles: new LocalStore<CollectibleInfoParams[]>(LocalStorageKey.COLLECTIBLES)
  }

  private async loadBalances(account: string) {
    const userCollectibles = this.local.userCollectibles.get() ?? []

    if (userCollectibles.length === 0) {
      return
    }

    this.isFetchingBalances.set(true)

    const balances: CollectibleInfo[] = []

    const promises = userCollectibles.map(async params => {
      const response = await this.getCollectibleInfo(params)

      // Remove collectible if not owner
      if (!response.isOwner) {
        this.removeCollectible({ collectibleInfoParams: params, collectibleInfoResponse: response })
        return
      }

      balances.push({
        collectibleInfoParams: params,
        collectibleInfoResponse: response
      })
    })

    await Promise.allSettled(promises)

    this.userCollectibles.set(balances)

    this.isFetchingBalances.set(false)
  }

  async getCollectibleInfo(params: CollectibleInfoParams): Promise<CollectibleInfoResponse> {
    const gateway = await getGatewayAddress()
    console.log(gateway)

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
    let balance: bigint | undefined
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
      uri = uri.replace('ipfs://', gateway)
    }

    if (uri.includes('{id}')) {
      uri = uri.replace('{id}', params.tokenId.toString())
    }

    const metadata = await fetch(uri).then(res => res.json())

    if (metadata) {
      decimals = metadata.decimals
      image = metadata.image
      name = metadata.name
    }

    if (image?.startsWith('ipfs://')) {
      image = image.replace('ipfs://', gateway)
    }

    balance = balance ?? BigInt(1)
    decimals = decimals ?? 0

    this.isFetchingCollectibleInfo.set(false)

    return { isOwner: true, uri, image, name, balance, decimals }
  }

  async addCollectible(collectibleInfo: CollectibleInfo) {
    if (collectibleInfo.collectibleInfoResponse.isOwner) {
      const current = this.local.userCollectibles.get() ?? []
      if (
        current.some(
          c =>
            c.address === collectibleInfo.collectibleInfoParams.address &&
            c.tokenId === collectibleInfo.collectibleInfoParams.tokenId
        )
      ) {
        throw new Error('Collectible already added')
      }
      this.local.userCollectibles.set([...current, collectibleInfo.collectibleInfoParams])
    }
  }

  async removeCollectible(collectibleInfo: CollectibleInfo) {
    const current = this.local.userCollectibles.get() ?? []
    const filtered = current.filter(
      c =>
        c.address !== collectibleInfo.collectibleInfoParams.address ||
        c.tokenId !== collectibleInfo.collectibleInfoParams.tokenId
    )
    this.local.userCollectibles.set(filtered)
  }

  async removeAllCollectibles() {
    this.local.userCollectibles.set([])
  }
}
