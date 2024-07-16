import { Account } from '@0xsequence/account'
import { commons } from '@0xsequence/core'
import { ContractType, TokenBalance } from '@0xsequence/indexer'
import { ethers } from 'ethers'

import { ERC20_ABI } from '~/constants/abi'
import { LocalStorageKey } from '~/constants/storage'

import { EIP1193Provider, EIP6963ProviderDetail, EIP6963ProviderInfo } from '~/hooks/useSyncProviders'

import { observable } from '~/stores'

import { Store } from '.'
import { AuthStore } from './AuthStore'
import { LocalStore } from './LocalStore'
import { NetworkStore } from './NetworkStore'

declare global {
  interface Window {
    ethereum: any
    sequence: any
    walletRouter: any
  }
}

export class WalletStore {
  availableExternalProviders = observable<EIP6963ProviderDetail[]>([])

  selectedExternalProvider = observable<EIP6963ProviderDetail | undefined>(undefined)
  selectedExternalWalletAddress = observable<string | undefined>(undefined)

  isSendingTransaction = observable<{ tokenBalance: TokenBalance; amount: string; to: string } | undefined>(
    undefined
  )

  private local = {
    lastConnectedExternalProviderInfo: new LocalStore<EIP6963ProviderInfo>(
      LocalStorageKey.LAST_CONNECTED_EXTERNAL_PROVIDER_INFO
    )
  }

  constructor(private store: Store) {
    this.availableExternalProviders.subscribe(providers => {
      const lastConnected = this.local.lastConnectedExternalProviderInfo.get()

      const lastConnectedProvider = providers.find(provider => {
        return lastConnected?.name === provider.info.name
      })

      if (lastConnectedProvider) {
        this.setExternalProvider(lastConnectedProvider)
      }
    })
  }

  sendToken = async (tokenBalance: TokenBalance, amount: string, to: string): Promise<{ hash: string }> => {
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

    this.isSendingTransaction.set({ tokenBalance, amount, to })

    const provider = new ethers.JsonRpcProvider(networkForToken.rpcUrl)

    const externalProvider = this.selectedExternalProvider.get()?.provider

    if (!externalProvider) {
      throw new Error('No external provider selected')
    }

    const externalProviderAccounts = await this.getExternalProviderAccounts(externalProvider)
    const externalProviderAddress = externalProviderAccounts[0]

    await this.switchToChain(externalProvider, chainId)

    let txn: commons.transaction.Transactionish | undefined

    if (tokenBalance.contractType === ContractType.NATIVE) {
      console.info('Sending native token with address, on chainId: ', tokenBalance.contractAddress, chainId)

      txn = {
        to,
        value: ethers.parseEther(amount)
      }
    } else if (tokenBalance.contractType === ContractType.ERC20) {
      console.info('Sending ERC20 token with address, on chainId: ', tokenBalance.contractAddress, chainId)

      const erc20 = new ethers.Contract(tokenBalance.contractAddress, ERC20_ABI, provider)
      txn = await erc20.transfer.populateTransaction(
        to,
        ethers.parseUnits(amount, tokenBalance.contractInfo?.decimals ?? 18)
      )
    }

    if (!txn) {
      this.isSendingTransaction.set(undefined)
      throw new Error('Could not create transaction')
    }

    let hash: string | undefined

    try {
      const response = await this.sendTransaction(
        account,
        externalProvider,
        externalProviderAddress,
        txn,
        chainId
      )
      hash = response.hash
    } catch (error) {
      this.isSendingTransaction.set(undefined)
      throw error
    }

    return { hash }
  }

  setExternalProvider = async (provider: EIP6963ProviderDetail) => {
    const externalProviderAccounts = await this.getExternalProviderAccounts(provider.provider)
    const externalProviderAddress = externalProviderAccounts[0]

    this.local.lastConnectedExternalProviderInfo.set(provider.info)
    this.selectedExternalProvider.set(provider)
    this.selectedExternalWalletAddress.set(externalProviderAddress)

    provider.provider.on('accountsChanged', async accounts => {
      if (accounts.length === 0) {
        this.selectedExternalProvider.set(undefined)
        this.selectedExternalWalletAddress.set(undefined)
        return
      }
      if (accounts[0] !== externalProviderAddress) {
        const newExternalProviderAccounts = await this.getExternalProviderAccounts(provider.provider)
        const newExternalProviderAddress = newExternalProviderAccounts[0]
        this.selectedExternalWalletAddress.set(newExternalProviderAddress)
      }
    })
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

    // Calculating gas is not actually needed, but there can be a node issue which returns the following error:
    // MetaMask - RPC Error: Cannot destructure property 'gasLimit' of '(intermediate value)' as it is null.
    // Note: this error came up when using rpc url https://rpc.ankr.com/polygon
    const gas = await externalProvider.request({
      method: 'eth_estimateGas',
      params: [
        {
          from: externalProviderAddress,
          to: decorated.entrypoint,
          data: commons.transaction.encodeBundleExecData(decorated)
        }
      ]
    })

    const hash = await externalProvider.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: externalProviderAddress,
          to: decorated.entrypoint,
          data: commons.transaction.encodeBundleExecData(decorated),
          gas
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
        { method: 'wallet_switchEthereumChain', params: [{ chainId: ethers.toQuantity(chainId) }] },
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
