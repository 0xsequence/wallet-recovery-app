import { ContractType, ResourceStatus, TokenBalance } from '@0xsequence/indexer'
import { NetworkConfig, NetworkType, getChainId } from '@0xsequence/network'
import { ethers, isError } from 'ethers'

import { getIndexedDB } from '~/utils/indexeddb'
import { getNativeTokenInfo } from '~/utils/network'

import { ERC20_ABI } from '~/constants/abi'
import { DEFAULT_PUBLIC_RPC_LIST } from '~/constants/network'
import { LocalStorageKey } from '~/constants/storage'
import { IndexedDBKey } from '~/constants/storage'

import { Store, observable } from '.'
import { AuthStore } from './AuthStore'
import { LocalStore } from './LocalStore'
import { NetworkStore } from './NetworkStore'

type UserAddedToken = {
  chainId: number
  address: string
  contractType: ContractType
  decimals: number
  symbol: string
}

export type UserAddedTokenInitialInfo = {
  symbol: string
  decimals: number
  balance: string
}

export class TokenStore {
  isFetchingBalances = observable(false)
  isFetchingTokenInfo = observable(false)

  balances = observable<TokenBalance[]>([])

  userAddedTokens = observable<UserAddedToken[]>([])

  private local = {
    userAddedTokens: new LocalStore<UserAddedToken[]>(LocalStorageKey.TOKENS_USER_ADDITIONS)
  }

  constructor(private store: Store) {}

  async loadBalances(account: string, networks: NetworkConfig[]) {
    const mainnets = networks.filter(network => network.type === NetworkType.MAINNET)
    const update: TokenBalance[] = []

    this.isFetchingBalances.set(true)

    await Promise.allSettled(
      mainnets.map(async network => {
        if (!network.rpcUrl) {
          console.warn(`No RPC URL found for network ${network.name}`)
          return
        }
        const provider = new ethers.JsonRpcProvider(network.rpcUrl)
        provider.on('error', e => {
          if (isError(e, 'NETWORK_ERROR')) {
            provider.destroy()
          }
        })
        try {
          const balance = await provider.getBalance(account)
          update.push({
            contractType: ContractType.NATIVE,
            contractAddress: ethers.ZeroAddress,
            tokenID: '',
            accountAddress: account,
            balance: balance.toString(),
            chainId: network.chainId,
            blockHash: ethers.ZeroHash,
            blockNumber: 0,
            contractInfo: getNativeTokenInfo(getChainId(network.chainId)),
            uniqueCollectibles: '0',
            isSummary: true
          })
        } catch (err) {
          console.error(err)
        }
      })
    )
    this.balances.set(update)

    const userTokens = this.local.userAddedTokens.get() ?? []
    this.userAddedTokens.set(userTokens)

    if (userTokens.length > 0) {
      await Promise.allSettled(
        userTokens.map(async token => {
          await this.loadUserAddedTokenBalance(account, token)
        })
      )
    }

    this.isFetchingBalances.set(false)
  }

  private async loadUserAddedTokenBalance(accountAddress: string, token: UserAddedToken) {
    const provider = this.store.get(NetworkStore).providerForChainId(token.chainId)
    try {
      const erc20 = new ethers.Contract(token.address, ERC20_ABI, provider)
      const balance = await erc20.balanceOf(accountAddress)

      const currentBalances = this.balances.get()
      const existingTokenIndex = currentBalances.findIndex(
        b => b.contractAddress === token.address && b.chainId === token.chainId
      )

      const tokenBalance: TokenBalance = {
        contractType: token.contractType,
        contractAddress: token.address,
        tokenID: '',
        accountAddress: accountAddress,
        balance: balance.toString(),
        chainId: token.chainId,
        blockHash: ethers.ZeroHash,
        blockNumber: 0,
        contractInfo: {
          address: token.address,
          chainId: token.chainId,
          decimals: token.decimals,
          name: token.symbol,
          symbol: token.symbol,
          source: 'USER_ADDED',
          status: ResourceStatus.AVAILABLE,
          type: 'ERC20',
          logoURI: '',
          deployed: true,
          bytecodeHash: '',
          extensions: {
            categories: [],
            ogName: '',
            featureIndex: 0,
            link: '',
            description: '',
            ogImage: '',
            originAddress: '',
            originChainId: 0,
            blacklist: false,
            verified: true,
            verifiedBy: 'User',
            featured: false
          },
          updatedAt: '0'
        },
        uniqueCollectibles: '0',
        isSummary: true
      }

      if (existingTokenIndex !== -1) {
        // Update existing token balance
        currentBalances[existingTokenIndex] = tokenBalance
      } else {
        // Add new token balance
        currentBalances.push(tokenBalance)
      }

      this.balances.set([...currentBalances])
    } catch (err) {
      console.error(err)
    }
  }

  async updateTokenBalance(tokenBalance: TokenBalance) {
    const provider = this.store.get(NetworkStore).providerForChainId(tokenBalance.chainId)

    this.isFetchingBalances.set(true)

    const accountAddress = this.store.get(AuthStore).accountAddress.get()

    if (!accountAddress) {
      console.warn(`No account found`)
      return
    }

    const update = this.balances.get()

    try {
      let balance: bigint

      if (tokenBalance.contractType === ContractType.NATIVE) {
        balance = await provider.getBalance(accountAddress)
      } else {
        const erc20 = new ethers.Contract(tokenBalance.contractAddress, ERC20_ABI, provider)
        balance = await erc20.balanceOf(accountAddress)
      }

      update.map(b => {
        if (b.contractAddress === tokenBalance.contractAddress && b.chainId === tokenBalance.chainId) {
          b.balance = balance.toString()
        }
      })

      this.balances.set([...update])
    } catch (err) {
      console.error(err)
    }

    this.isFetchingBalances.set(false)
  }

  async addToken(token: UserAddedToken) {
    const userAddedTokens = this.local.userAddedTokens.get() ?? []

    const alreadyExists = userAddedTokens.some(
      t => t.chainId === token.chainId && t.address === token.address
    )

    if (alreadyExists) {
      throw new Error(`Token with chainId ${token.chainId} and address ${token.address} already exists`)
    }

    userAddedTokens.push(token)
    this.local.userAddedTokens.set(userAddedTokens)
    this.userAddedTokens.set([...userAddedTokens])

    const accountAddress = this.store.get(AuthStore).accountAddress.get()

    if (accountAddress) {
      this.isFetchingBalances.set(true)
      await this.loadUserAddedTokenBalance(accountAddress, token)
      this.isFetchingBalances.set(false)
    }
  }

  async removeToken(token: UserAddedToken) {
    const userAddedTokens = this.local.userAddedTokens.get() ?? []

    const filtered = userAddedTokens.filter(
      t => !(t.chainId === token.chainId && t.address === token.address)
    )

    this.local.userAddedTokens.set(filtered)
    this.userAddedTokens.set([...filtered])

    const filteredBalances = this.balances
      .get()
      .filter(b => !(b.chainId === token.chainId && b.contractAddress === token.address))

    this.balances.set([...filteredBalances])
  }

  async getTokenInfo(chainId: number, address: string): Promise<UserAddedTokenInitialInfo> {
    const provider = this.store.get(NetworkStore).providerForChainId(chainId)

    this.isFetchingTokenInfo.set(true)

    try {
      const accountAddress = this.store.get(AuthStore).accountAddress.get()
      const erc20 = new ethers.Contract(address, ERC20_ABI, provider)

      const decimals = await erc20.decimals()
      const symbol = await erc20.symbol()
      const balance = await erc20.balanceOf(accountAddress)

      this.isFetchingTokenInfo.set(false)

      if (decimals && symbol) {
        return {
          decimals: Number(decimals),
          symbol,
          balance: ethers.formatUnits(balance, decimals)
        }
      } else {
        throw new Error(`Could not get decimals and symbol for token at ${address}`)
      }
    } catch (err) {
      console.error(err)
      throw new Error(`Error getting token info ${JSON.stringify(err)}`)
    }
  }

  async getTokenList(chainId: number) {
    const chainName = DEFAULT_PUBLIC_RPC_LIST.get(chainId)?.[0]
    if (!chainName) {
      return []
    }

    const db = await getIndexedDB(IndexedDBKey.ERC20)

    const tokenList = await db.get(IndexedDBKey.ERC20, chainName)

    if (!tokenList) {
      const fetchedTokenList = await fetch(
        `https://raw.githubusercontent.com/0xsequence/token-directory/master/index/${chainName}/erc20.json`
      ).then(res => res.json())

      const data = { tokens: fetchedTokenList.tokens, date: new Date().toISOString() }

      await db.put(IndexedDBKey.ERC20, data, chainName)
      return data
    }

    return tokenList
  }

  async addExternalTokenList(chainId: number, tokenList: any[]) {
    const chainName = DEFAULT_PUBLIC_RPC_LIST.get(chainId)?.[0]
    if (!chainName) {
      return []
    }

    const data = { tokens: tokenList, date: new Date().toISOString() }

    const db = await getIndexedDB(IndexedDBKey.ERC20)
    await db.put(IndexedDBKey.ERC20, data, chainName)
  }

  async resetTokenList(chainId: number) {
    const chainName = DEFAULT_PUBLIC_RPC_LIST.get(chainId)?.[0]
    if (!chainName) {
      return []
    }

    const db = await getIndexedDB(IndexedDBKey.ERC20)
    await db.delete(IndexedDBKey.ERC20, chainName)

    return await this.getTokenList(chainId)
  }

  clear() {
    this.local.userAddedTokens.set([])

    this.isFetchingBalances.set(false)
    this.isFetchingTokenInfo.set(false)
    this.balances.set([])
  }
}
