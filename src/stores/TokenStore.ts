import { ContractType, TokenBalance } from '@0xsequence/indexer'
import { NetworkConfig, NetworkType, getChainId } from '@0xsequence/network'
import { ethers } from 'ethers'

import { getNativeTokenInfo } from '~/utils/network'
import { subscribeImmediately } from '~/utils/observable'

import { ERC20_ABI } from '~/constants/abi'
import { LocalStorageKey } from '~/constants/storage'

import { Store, observable } from '.'
import { AuthStore } from './AuthStore'
import { LocalStore } from './LocalStore'
import { NetworkStore } from './NetworkStore'

export type UserAddedToken = {
  chainId: number
  address: string
  contractType: ContractType
  decimals: number
  symbol: string
}

export type UserAddedTokenInitialInfo = {
  symbol: string
  decimals: number
}

export class TokenStore {
  isFetchingBalances = observable(false)
  isFetchingTokenInfo = observable(false)

  balances = observable<TokenBalance[]>([])

  userAddedTokens = observable<UserAddedToken[]>([])

  constructor(private store: Store) {
    const networkStore = this.store.get(NetworkStore)

    subscribeImmediately(networkStore.networks, networks => {
      const accountAddress = this.store.get(AuthStore).accountAddress.get()
      if (accountAddress && networks.length > 0) {
        this.loadBalances(accountAddress, networks)
      }
    })
  }

  private local = {
    userAddedTokens: new LocalStore<UserAddedToken[]>(LocalStorageKey.TOKENS_USER_ADDITIONS)
  }

  private async loadBalances(account: string, networks: NetworkConfig[]) {
    const mainnets = networks.filter(network => network.type === NetworkType.MAINNET)
    const update: TokenBalance[] = []

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
            blockHash: ethers.constants.HashZero,
            blockNumber: 0,
            contractInfo: getNativeTokenInfo(getChainId(network.chainId))
          })
        } catch (err) {
          console.error(err)
        }
      })
    )

    const userTokens = this.local.userAddedTokens.get() ?? []

    this.userAddedTokens.set(userTokens)

    if (userTokens.length > 0) {
      await Promise.allSettled(
        userTokens.map(async token => {
          await this.loadUserAddedTokenBalance(account, token)
        })
      )
    }

    this.balances.set(update)
    this.isFetchingBalances.set(false)
  }

  private async loadUserAddedTokenBalance(account: string, token: UserAddedToken) {
    const networkForToken = this.store
      .get(NetworkStore)
      .networks.get()
      .find(network => network.chainId === token.chainId)

    if (!networkForToken) {
      console.warn(`No network found for chainId ${token.chainId}`)
      return
    }

    if (!networkForToken.rpcUrl) {
      console.warn(`No RPC URL found for network ${networkForToken.name}`)
      return
    }

    const provider = new ethers.providers.JsonRpcProvider(networkForToken.rpcUrl)
    try {
      const erc20 = new ethers.Contract(token.address, ERC20_ABI, provider)
      const balance = await erc20.balanceOf(account)

      const updatedBalances = this.balances.get()

      updatedBalances.push({
        contractType: token.contractType,
        contractAddress: token.address,
        tokenID: '',
        accountAddress: account,
        balance: balance.toString(),
        chainId: token.chainId,
        blockHash: ethers.constants.HashZero,
        blockNumber: 0,
        contractInfo: {
          address: token.address,
          chainId: token.chainId,
          decimals: token.decimals,
          name: token.symbol,
          symbol: token.symbol,
          type: 'ERC20',
          logoURI: '',
          deployed: true,
          bytecodeHash: '',
          extensions: {
            link: '',
            description: '',
            ogImage: '',
            originAddress: '',
            originChainId: 0,
            blacklist: false,
            verified: true,
            verifiedBy: 'User'
          },
          updatedAt: '0'
        }
      })

      this.balances.set(updatedBalances)
    } catch (err) {
      console.error(err)
    }
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
    this.userAddedTokens.set(userAddedTokens)

    const accountAddress = this.store.get(AuthStore).accountAddress.get()

    if (accountAddress) {
      this.isFetchingBalances.set(true)
      await this.loadUserAddedTokenBalance(accountAddress, token)
      this.isFetchingBalances.set(false)
    }
  }

  async removeToken(token: UserAddedToken) {
    const userAddedTokens = this.local.userAddedTokens.get()

    const filtered =
      userAddedTokens?.filter(t => !(t.chainId === token.chainId && t.address === token.address)) ?? []

    this.local.userAddedTokens.set(filtered)
    this.userAddedTokens.set(filtered)

    const filteredBalances = this.balances
      .get()
      .filter(b => !(b.chainId === token.chainId && b.contractAddress === token.address))

    this.balances.set(filteredBalances)
  }

  async getTokenInfo(chainId: number, address: string): Promise<UserAddedTokenInitialInfo> {
    const networkForToken = this.store
      .get(NetworkStore)
      .networks.get()
      .find(network => network.chainId === chainId)

    if (!networkForToken) {
      console.warn(`No network found for chainId ${chainId}`)
      throw new Error(`No network found for chainId ${chainId}`)
    }

    if (!networkForToken.rpcUrl) {
      console.warn(`No RPC URL found for network ${networkForToken.name}`)
      throw new Error(`No RPC URL found for network ${networkForToken.name}`)
    }

    this.isFetchingTokenInfo.set(true)

    const provider = new ethers.providers.JsonRpcProvider(networkForToken.rpcUrl)

    try {
      const erc20 = new ethers.Contract(address, ERC20_ABI, provider)

      const decimals = await erc20.decimals()
      const symbol = await erc20.symbol()

      this.isFetchingTokenInfo.set(false)

      if (decimals && symbol) {
        return {
          decimals,
          symbol
        }
      } else {
        throw new Error(`Could not get decimals and symbol for token at ${address}`)
      }
    } catch (err) {
      console.error(err)
      throw new Error(`Error getting token info ${JSON.stringify(err)}`)
    }
  }

  clear() {
    this.local.userAddedTokens.set([])

    this.isFetchingBalances.set(false)
    this.isFetchingTokenInfo.set(false)
    this.balances.set([])
  }
}
