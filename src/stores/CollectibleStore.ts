import { ContractType } from '@0xsequence/indexer'
import { ethers } from 'ethers'
import { isAddress } from 'viem'

import { IPFSGatewayHelper } from '~/utils/gateways'
import { getIndexedDB } from '~/utils/indexeddb'
import { subscribeImmediately } from '~/utils/observable'

import { ERC721_ABI, ERC1155_ABI } from '~/constants/abi'
import { DEFAULT_PUBLIC_RPC_LIST } from '~/constants/network'
import { IndexedDBKey, LocalStorageKey } from '~/constants/storage'

import { Store, observable } from '.'
import { AuthStore } from './AuthStore'
import { LocalStore } from './LocalStore'
import { NetworkStore } from './NetworkStore'

export const CollectibleContractTypeValues = {
  ERC721: 'ERC721',
  ERC1155: 'ERC1155'
} as const

export type CollectibleContractType = keyof typeof CollectibleContractTypeValues

type CollectibleInfoParams = {
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

  private ipfsGatewayHelper = new IPFSGatewayHelper()

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

  private async loadBalances(_account?: string) {
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
    // Validate address format first
    if (!isAddress(params.address)) {
      throw new Error(`Invalid collectible address format: ${params.address}`)
    }

    const accountAddress = this.store.get(AuthStore).accountAddress.get()

    if (!accountAddress) {
      throw new Error('No account found')
    }

    const provider = this.store.get(NetworkStore).providerForChainId(params.chainId)

    this.isFetchingCollectibleInfo.set(true)

    try {
      let uri: string | undefined
      let image: string | undefined
      let name: string | undefined
      let balance: bigint | undefined
      let decimals: number | undefined

      if (params.contractType === ContractType.ERC721) {
        try {
          const contract = new ethers.Contract(params.address, ERC721_ABI, provider)
          
          // First check if the contract has code (is a valid contract)
          const code = await provider.getCode(params.address)
          if (code === '0x') {
            throw new Error('NOT_A_CONTRACT')
          }
          
          const owner = await contract.ownerOf(params.tokenId)
          const isOwner = owner.toLowerCase() === accountAddress.toLowerCase()

          if (!isOwner) {
            return { isOwner, uri: '' }
          }

          uri = await contract.tokenURI(params.tokenId)
        } catch (err: any) {
          // Not a contract at this address
          if (err.message === 'NOT_A_CONTRACT') {
            throw new Error('No contract found at this address on the selected chain')
          }
          // Token doesn't exist or other contract errors
          if (err.code === 'BAD_DATA' || err.code === 'CALL_EXCEPTION') {
            throw new Error('Token ID does not exist in this contract')
          }
          throw err
        }
      } else if (params.contractType === ContractType.ERC1155) {
        try {
          const contract = new ethers.Contract(params.address, ERC1155_ABI, provider)
          
          // First check if the contract has code (is a valid contract)
          const code = await provider.getCode(params.address)
          if (code === '0x') {
            throw new Error('NOT_A_CONTRACT')
          }
          
          balance = await contract.balanceOf(accountAddress, params.tokenId)

          if (!balance) {
            return { isOwner: false, uri: '' }
          }

          balance = balance ?? BigInt(1)

          uri = await contract.uri(params.tokenId)
        } catch (err: any) {
          // Not a contract at this address
          if (err.message === 'NOT_A_CONTRACT') {
            throw new Error('No contract found at this address on the selected chain')
          }
          // Token doesn't exist or other contract errors
          if (err.code === 'BAD_DATA' || err.code === 'CALL_EXCEPTION') {
            throw new Error('Token ID does not exist in this contract')
          }
          throw err
        }
      }

      if (!uri) {
        throw new Error('Could not get collectible URI')
      }

      if (uri.includes('{id}')) {
        uri = uri.replace('{id}', params.tokenId.toString())
      }

      let metadata

      try {
        if (uri.startsWith('ipfs://')) {
          metadata = await this.ipfsGatewayHelper.fetch(uri).then(res => res.json())
        } else {
          metadata = await fetch(uri).then(res => res.json())
        }

        if (metadata) {
          decimals = metadata.decimals
          image = metadata.image
          name = metadata.name
        }

        if (image?.startsWith('ipfs://')) {
          image = await this.ipfsGatewayHelper.getGatewayURL(image)
        }
      } catch {
        if (!name) {
          name = `No Metadata Found Address: ${params.address} TokenId: ${params.tokenId}`
        }
      }

      decimals = decimals ?? 0

      return { isOwner: true, uri, image, name, balance, decimals }
    } catch (err: any) {
      console.error(err)
      // Pass through specific error messages
      if (err.message === 'No contract found at this address on the selected chain' || 
          err.message === 'Token ID does not exist in this contract') {
        throw err
      }
      throw new Error(`Error getting collectible info: ${err.message || 'Unknown error'}`)
    } finally {
      this.isFetchingCollectibleInfo.set(false)
    }
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

      this.isFetchingCollectibleInfo.set(true)
      this.loadBalances()
      this.isFetchingCollectibleInfo.set(false)
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

    const currentBalances = this.userCollectibles.get()
    const filteredBalances = currentBalances.filter(
      c =>
        c.collectibleInfoParams.address !== collectibleInfo.collectibleInfoParams.address ||
        c.collectibleInfoParams.tokenId !== collectibleInfo.collectibleInfoParams.tokenId
    )
    this.userCollectibles.set(filteredBalances)
  }

  async getERC721List(chainId: number) {
    const chainName = DEFAULT_PUBLIC_RPC_LIST.get(chainId)?.[0]
    if (!chainName) {
      return []
    }

    const db = await getIndexedDB(IndexedDBKey.ERC721)

    const tokenList = await db.get(IndexedDBKey.ERC721, chainName)
    if (!tokenList) {
      const fetchedTokenList = await fetch(
        `https://raw.githubusercontent.com/0xsequence/token-directory/master/index/${chainName}/erc721.json`
      ).then(res => res.json())

      const data = { tokens: fetchedTokenList.tokens, date: new Date().toISOString() }

      await db.put(IndexedDBKey.ERC721, data, chainName)
      return data
    }

    return tokenList
  }

  async getERC1155List(chainId: number) {
    const chainName = DEFAULT_PUBLIC_RPC_LIST.get(chainId)?.[0]
    if (!chainName) {
      return []
    }

    const db = await getIndexedDB(IndexedDBKey.ERC1155)

    const tokenList = await db.get(IndexedDBKey.ERC1155, chainName)

    if (!tokenList) {
      const fetchedTokenList = await fetch(
        `https://raw.githubusercontent.com/0xsequence/token-directory/master/index/${chainName}/erc1155.json`
      ).then(res => res.json())

      const data = { tokens: fetchedTokenList.tokens, date: new Date().toISOString() }

      await db.put(IndexedDBKey.ERC1155, data, chainName)
      return data
    }

    return tokenList
  }

  async addExternalERC721List(chainId: number, collectibleList: any[]) {
    const chainName = DEFAULT_PUBLIC_RPC_LIST.get(chainId)?.[0]
    if (!chainName) {
      return []
    }

    const data = { tokens: collectibleList, date: new Date().toISOString() }

    const db = await getIndexedDB(IndexedDBKey.ERC721)
    await db.put(IndexedDBKey.ERC721, data, chainName)
  }

  async addExternalERC1155List(chainId: number, collectibleList: any[]) {
    const chainName = DEFAULT_PUBLIC_RPC_LIST.get(chainId)?.[0]
    if (!chainName) {
      return []
    }

    const data = { tokens: collectibleList, date: new Date().toISOString() }

    const db = await getIndexedDB(IndexedDBKey.ERC1155)
    await db.put(IndexedDBKey.ERC1155, data, chainName)
  }

  async resetERC721List(chainId: number) {
    const chainName = DEFAULT_PUBLIC_RPC_LIST.get(chainId)?.[0]
    if (!chainName) {
      return []
    }

    const db = await getIndexedDB(IndexedDBKey.ERC721)
    await db.delete(IndexedDBKey.ERC721, chainName)

    return await this.getERC721List(chainId)
  }

  async resetERC1155List(chainId: number) {
    const chainName = DEFAULT_PUBLIC_RPC_LIST.get(chainId)?.[0]
    if (!chainName) {
      return []
    }

    const db = await getIndexedDB(IndexedDBKey.ERC1155)
    await db.delete(IndexedDBKey.ERC1155, chainName)

    return await this.getERC1155List(chainId)
  }
}
