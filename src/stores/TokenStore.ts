import { ContractType, TokenBalance } from '@0xsequence/indexer'
import { NetworkConfig, NetworkType, getChainId } from '@0xsequence/network'
import { ethers } from 'ethers'

import { getNativeTokenInfo } from '~/utils/network'
import { subscribeImmediately } from '~/utils/observable'

import { LocalStorageKey } from '~/constants/storage'

import { Store, observable } from '.'
import { AuthStore } from './AuthStore'
import { LocalStore } from './LocalStore'
import { NetworkStore } from './NetworkStore'

type UserAddedToken = {
  chainId: number
  address: string
  contractType: ContractType
}

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

  private local = {
    userAddedTokens: new LocalStore<UserAddedToken[]>(LocalStorageKey.TOKENS_USER_ADDITIONS)
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
            blockHash: ethers.constants.HashZero,
            blockNumber: 0,
            contractInfo: getNativeTokenInfo(getChainId(network.chainId))
          })
        } catch (err) {
          console.error(err)
        }
      })
    )

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
      const balance = await provider.getBalance(account)

      this.balances.get().push({
        contractType: token.contractType,
        contractAddress: token.address,
        tokenID: '',
        accountAddress: account,
        balance: balance.toString(),
        chainId: token.chainId,
        blockHash: ethers.constants.HashZero,
        blockNumber: 0,
        contractInfo: getNativeTokenInfo(getChainId(token.chainId))
      })
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

    const accountAddress = this.store.get(AuthStore).accountAddress.get()

    if (accountAddress) {
      this.loadUserAddedTokenBalance(accountAddress, token)
    }
  }
}
