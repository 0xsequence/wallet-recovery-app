import { Account } from '@0xsequence/account'
import { commons } from '@0xsequence/core'
import { ContractType, TokenBalance } from '@0xsequence/indexer'
import { ethers } from 'ethers'

import { ERC20_ABI } from '~/constants/abi'

import { EIP1193Provider } from '~/hooks/useSyncProviders'

import { observable } from '~/stores'

import { Store } from '.'
import { AuthStore } from './AuthStore'
import { NetworkStore } from './NetworkStore'

declare global {
  interface Window {
    ethereum: any
    sequence: any
    walletRouter: any
  }
}

export class WalletStore {
  constructor(private store: Store) {}

  selectedExternalProvider = observable<EIP1193Provider | undefined>(undefined)
  selectedExternalWalletAddress = observable<string | undefined>(undefined)

  sendERC20Transaction = async (
    tokenBalance: TokenBalance,
    amount: string,
    to: string
  ): Promise<{ hash: string }> => {
    const account = this.store.get(AuthStore).account
    const chainId = tokenBalance.chainId

    if (!account) {
      throw new Error('No account found')
    }

    const networkForToken = this.store
      .get(NetworkStore)
      .networks.get()
      .find(network => network.chainId === chainId)

    if (!networkForToken) {
      throw new Error(`No network found for chainId ${chainId}`)
    }

    if (!networkForToken.rpcUrl) {
      throw new Error(`No RPC URL found for network ${networkForToken.name}`)
    }

    const provider = new ethers.providers.JsonRpcProvider(networkForToken.rpcUrl)

    const externalProvider = this.selectedExternalProvider.get()

    if (!externalProvider) {
      throw new Error('No external provider selected')
    }

    const externalProviderAccounts = await this.getExternalProviderAccounts(externalProvider)
    const externalProviderAddress = externalProviderAccounts[0]

    await this.switchToChain(externalProvider, chainId)

    let txn: commons.transaction.Transactionish | undefined

    if (tokenBalance.contractType === ContractType.NATIVE) {
      txn = {
        to,
        value: ethers.utils.parseEther(amount)
      }
    } else if (tokenBalance.contractType === ContractType.ERC20) {
      const erc20 = new ethers.Contract(tokenBalance.contractAddress, ERC20_ABI, provider)
      txn = await erc20.populateTransaction.transfer(
        to,
        ethers.utils.parseUnits(amount, tokenBalance.contractInfo?.decimals ?? 18)
      )
    }

    if (!txn) {
      throw new Error('Could not create transaction')
    }

    return await this.sendTransaction(account, externalProvider, externalProviderAddress, txn, chainId)
  }

  setExternalProvider = async (provider: EIP1193Provider) => {
    this.selectedExternalProvider.set(provider)
    const externalProviderAccounts = await this.getExternalProviderAccounts(provider)
    const externalProviderAddress = externalProviderAccounts[0]
    this.selectedExternalWalletAddress.set(externalProviderAddress)
  }

  private async sendTransaction(
    account: Account,
    externalProvider: EIP1193Provider,
    externalProviderAddress: string,
    txn: commons.transaction.Transactionish,
    chainId: number
  ): Promise<{ hash: string }> {
    const status = await account.status(chainId)
    const predecorated = await account.predecorateTransactions(txn, status, chainId)
    const signed = await account.signTransactions(predecorated, chainId, undefined, { serial: true })
    const decorated = await account.decorateTransactions(signed, status)

    const hash = await externalProvider.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: externalProviderAddress,
          to: decorated.entrypoint,
          data: commons.transaction.encodeBundleExecData(decorated)
        }
      ]
    })

    return { hash: hash as string }
  }

  private async getExternalProviderAccounts(provider: EIP1193Provider): Promise<string[]> {
    return new Promise((resolve, reject) => {
      provider.sendAsync?.({ method: 'eth_requestAccounts', params: [] }, (error, accounts) => {
        if (error) {
          reject(error)
        }
        if ((accounts as any).result.length === 0) {
          reject(new Error('No accounts found'))
        }
        resolve((accounts as any).result)
      })
    })
  }

  private async switchToChain(provider: EIP1193Provider, chainId: number) {
    return new Promise((resolve, reject) => {
      provider.sendAsync?.(
        { method: 'wallet_switchEthereumChain', params: [{ chainId: ethers.utils.hexValue(chainId) }] },
        (error, result) => {
          if (error) {
            reject(error)
          }
          resolve(result)
        }
      )
    })
  }
}
