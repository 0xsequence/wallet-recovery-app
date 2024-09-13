import { Account } from '@0xsequence/account'
import { commons } from '@0xsequence/core'
import { ContractType, TokenBalance } from '@0xsequence/indexer'
import EthereumProvider from '@walletconnect/ethereum-provider'
import { ethers } from 'ethers'

import { ERC20_ABI, ERC721_ABI, ERC1155_ABI } from '~/constants/abi'
import { LocalStorageKey } from '~/constants/storage'

import { EIP1193Provider } from '~/hooks/useSyncProviders'

import { observable } from '~/stores'

import { ProviderDetail, ProviderInfo } from '~/components/SelectProvider'

import { Store } from '.'
import { AuthStore } from './AuthStore'
import { CollectibleInfo } from './CollectibleStore'
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
  availableExternalProviders = observable<ProviderDetail[]>([])

  selectedExternalProvider = observable<ProviderDetail | undefined>(undefined)
  selectedExternalWalletAddress = observable<string | undefined>(undefined)

  isSendingTokenTransaction = observable<
    { tokenBalance: TokenBalance; to: string; amount?: string } | undefined
  >(undefined)

  isSendingCollectibleTransaction = observable<
    { collectibleInfo: CollectibleInfo; to: string; amount?: string } | undefined
  >(undefined)

  private local = {
    lastConnectedExternalProviderInfo: new LocalStore<ProviderInfo>(
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

  getLastConnectedExternalProviderInfo = () => {
    return this.local.lastConnectedExternalProviderInfo.get()
  }

  sendToken = async (tokenBalance: TokenBalance, to: string, amount?: string): Promise<{ hash: string }> => {
    const account = this.store.get(AuthStore).account
    const chainId = tokenBalance.chainId

    if (!account) {
      throw new Error('No account found')
    }

    const networkForToken = this.store.get(NetworkStore).networkForChainId(chainId)

    if (!networkForToken) {
      throw new Error(`No network found for chainId ${chainId}`)
    }

    if (!networkForToken.rpcUrl) {
      throw new Error(`No RPC URL found for network ${networkForToken.name}`)
    }

    this.isSendingTokenTransaction.set({ tokenBalance, to, amount })

    const provider = new ethers.JsonRpcProvider(networkForToken.rpcUrl)

    const externalProvider = this.selectedExternalProvider.get()?.provider

    if (!externalProvider) {
      throw new Error('No external provider selected')
    }

    const externalProviderAccounts = await this.getExternalProviderAccounts(externalProvider)
    const externalProviderAddress = externalProviderAccounts[0]

    await this.switchToChain(externalProvider, chainId)

    let txn: commons.transaction.Transactionish | undefined

    if (!amount) {
      return { hash: '' }
    }

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
      this.isSendingTokenTransaction.set(undefined)
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
      this.isSendingTokenTransaction.set(undefined)
      throw error
    }

    return { hash }
  }

  sendCollectible = async (
    collectibleInfo: CollectibleInfo,
    to: string,
    amount?: string
  ): Promise<{ hash: string }> => {
    const account = this.store.get(AuthStore).account
    const chainId = collectibleInfo.collectibleInfoParams.chainId

    if (!account) {
      throw new Error('No account found')
    }

    const networkForToken = this.store.get(NetworkStore).networkForChainId(chainId)

    if (!networkForToken) {
      throw new Error(`No network found for chainId ${chainId}`)
    }

    if (!networkForToken.rpcUrl) {
      throw new Error(`No RPC URL found for network ${networkForToken.name}`)
    }

    this.isSendingCollectibleTransaction.set({ collectibleInfo, to, amount })

    const provider = new ethers.JsonRpcProvider(networkForToken.rpcUrl)

    const externalProvider = this.selectedExternalProvider.get()?.provider

    if (!externalProvider) {
      throw new Error('No external provider selected')
    }

    const externalProviderAccounts = await this.getExternalProviderAccounts(externalProvider)
    const externalProviderAddress = externalProviderAccounts[0]

    await this.switchToChain(externalProvider, chainId)

    let txn: commons.transaction.Transactionish | undefined

    if (collectibleInfo.collectibleInfoParams.contractType === 'ERC721') {
      console.info(
        'Sending ERC721 non-fungible token with address, on chainId: ',
        collectibleInfo.collectibleInfoParams.address,
        chainId
      )

      const erc721 = new ethers.Contract(collectibleInfo.collectibleInfoParams.address, ERC721_ABI, provider)

      txn = await erc721.safeTransferFrom.populateTransaction(
        account,
        to,
        collectibleInfo.collectibleInfoParams.tokenId
      )
    } else if (collectibleInfo.collectibleInfoParams.contractType === 'ERC1155') {
      console.info(
        'Sending ERC1155 token with address, on chainId: ',
        collectibleInfo.collectibleInfoParams.address,
        chainId
      )

      const erc1155 = new ethers.Contract(
        collectibleInfo.collectibleInfoParams.address,
        ERC1155_ABI,
        provider
      )

      if (!amount) {
        return { hash: '' }
      }

      txn = await erc1155.safeTransferFrom.populateTransaction(
        account,
        to,
        collectibleInfo.collectibleInfoParams.tokenId,
        ethers.parseUnits(amount, collectibleInfo?.collectibleInfoResponse?.decimals ?? 18),
        '0x'
      )
    }

    if (!txn) {
      this.isSendingCollectibleTransaction.set(undefined)
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
      this.isSendingCollectibleTransaction.set(undefined)
      throw error
    }

    return { hash }
  }

  setExternalProvider = async (providerDetail: ProviderDetail) => {
    const externalProviderAccounts = await this.getExternalProviderAccounts(providerDetail.provider)
    const externalProviderAddress = externalProviderAccounts[0]

    this.local.lastConnectedExternalProviderInfo.set(providerDetail.info)

    this.selectedExternalProvider.set(providerDetail)
    this.selectedExternalWalletAddress.set(externalProviderAddress)

    providerDetail.provider.on('accountsChanged', async accounts => {
      if (accounts.length === 0) {
        this.selectedExternalProvider.set(undefined)
        this.selectedExternalWalletAddress.set(undefined)
        return
      }
      if (accounts[0] !== externalProviderAddress) {
        const newExternalProviderAccounts = await this.getExternalProviderAccounts(providerDetail.provider)
        const newExternalProviderAddress = newExternalProviderAccounts[0]
        this.selectedExternalWalletAddress.set(newExternalProviderAddress)
      }
    })
  }

  private async sendTransaction(
    account: Account,
    externalProvider: EIP1193Provider | EthereumProvider,
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

  private async getExternalProviderAccounts(provider: EIP1193Provider | EthereumProvider): Promise<string[]> {
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

  private async switchToChain(provider: EIP1193Provider | EthereumProvider, chainId: number) {
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
