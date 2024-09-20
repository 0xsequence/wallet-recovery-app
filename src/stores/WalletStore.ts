import { Account } from '@0xsequence/account'
import { commons } from '@0xsequence/core'
import { ContractType, TokenBalance } from '@0xsequence/indexer'
import {
  ConnectOptions,
  MessageToSign,
  NetworkedConnectOptions,
  PromptConnectDetails,
  WalletRequestHandler,
  WalletUserPrompter,
  validateTransactionRequest
} from '@0xsequence/provider'
import EthereumProvider from '@walletconnect/ethereum-provider'
import { ethers } from 'ethers'

import { ERC20_ABI, ERC721_ABI, ERC1155_ABI } from '~/constants/abi'
import { LocalStorageKey } from '~/constants/storage'

import { EIP1193Provider } from '~/hooks/useSyncProviders'

import { observable, useObservable, useStore } from '~/stores'

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
  networkStore = useStore(NetworkStore)
  authStore = useStore(AuthStore)
  accountAddress = useObservable(this.authStore.accountAddress)

  availableExternalProviders = observable<ProviderDetail[]>([])
  selectedExternalProvider = observable<ProviderDetail | undefined>(undefined)
  selectedExternalWalletAddress = observable<string | undefined>(undefined)

  isSendingTokenTransaction = observable<
    { tokenBalance: TokenBalance; to: string; amount?: string } | undefined
  >(undefined)

  isSendingCollectibleTransaction = observable<
    { collectibleInfo: CollectibleInfo; to: string; amount?: string } | undefined
  >(undefined)

  isSigningTransaction = observable<boolean>(false)

  connectDetails = observable<PromptConnectDetails | undefined>(undefined)
  connectOptions = observable<NetworkedConnectOptions | undefined>(undefined)

  toSignTxnDetails = observable<
    { txn: commons.transaction.Transactionish; chainId?: number; options?: ConnectOptions } | undefined
  >(undefined)
  toSignTxnPermission = observable<'approved' | 'cancelled' | undefined>(undefined)
  toSignTxnResult = observable<{ hash: string } | undefined>(undefined)

  walletRequestHandler: WalletRequestHandler

  private local = {
    lastConnectedExternalProviderInfo: new LocalStore<ProviderInfo>(
      LocalStorageKey.LAST_CONNECTED_EXTERNAL_PROVIDER_INFO
    )
  }

  constructor(private store: Store) {
    this.walletRequestHandler = new WalletRequestHandler(
      undefined, // signer is set after wallet is initialized / signed in
      new Prompter(store),
      this.networkStore.networks.get()
    )

    this.walletRequestHandler.onConnectOptionsChange = connectOptions => {
      this.connectOptions.set(connectOptions)
    }

    this.availableExternalProviders.subscribe(providers => {
      const lastConnected = this.local.lastConnectedExternalProviderInfo.get()

      const lastConnectedProvider = providers.find(provider => {
        return lastConnected?.name === provider.info.name
      })

      if (lastConnectedProvider) {
        this.setExternalProvider(lastConnectedProvider)
      }
    })

    const account = this.store.get(AuthStore).account
    // Ignore error as likely caused by versioning of @0xsequence/account
    this.walletRequestHandler.signIn(account ?? null)
  }

  getLastConnectedExternalProviderInfo = () => {
    return this.local.lastConnectedExternalProviderInfo.get()
  }

  sendToken = async (tokenBalance: TokenBalance, to: string, amount?: string): Promise<{ hash: string }> => {
    try {
      const account = this.store.get(AuthStore).account
      const chainId = tokenBalance.chainId

      if (!account) {
        throw new Error('No account found')
      }

      const networkForToken = this.networkStore.networkForChainId(chainId)

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
    } catch {
      this.isSendingTokenTransaction.set(undefined)
      throw new Error('Could not create transaction')
    }
  }

  sendCollectible = async (
    collectibleInfo: CollectibleInfo,
    to: string,
    amount?: string
  ): Promise<{ hash: string }> => {
    try {
      const account = this.store.get(AuthStore).account
      const chainId = collectibleInfo.collectibleInfoParams.chainId

      if (!account) {
        throw new Error('No account found')
      }

      const networkForToken = this.networkStore.networkForChainId(chainId)

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

        const erc721 = new ethers.Contract(
          collectibleInfo.collectibleInfoParams.address,
          ERC721_ABI,
          provider
        )

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
    } catch {
      this.isSendingCollectibleTransaction.set(undefined)
      throw new Error('Could not create transaction')
    }
  }

  setExternalProvider = async (providerDetail: ProviderDetail | undefined) => {
    if (!providerDetail) {
      this.selectedExternalProvider.set(undefined)
      this.selectedExternalWalletAddress.set(undefined)
      this.local.lastConnectedExternalProviderInfo.set(undefined)
      return
    }

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

  signTransaction = async (
    txn: commons.transaction.Transactionish,
    chainId?: number,
    options?: ConnectOptions
  ): Promise<{ hash: string }> => {
    try {
      const provider = this.selectedExternalProvider.get()?.provider
      if (!provider) {
        throw new Error('No external provider selected')
      }

      const account = this.store.get(AuthStore).account
      if (!account) {
        throw new Error('No account found')
      }

      const providerAccounts = await this.getExternalProviderAccounts(provider)
      const providerAddress = providerAccounts[0]
      if (!providerAddress) {
        throw new Error('No provider address found')
      }

      const response = await this.sendTransaction(account, provider, providerAddress, txn, chainId ?? 1)

      return response
    } catch (error) {
      this.isSigningTransaction.set(false)
      this.toSignTxnDetails.set(undefined)
      this.toSignTxnPermission.set(undefined)
      this.toSignTxnResult.set(undefined)
      throw error
    }
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

// dependency injected into walletRequestHandler, do not directly access
class Prompter implements WalletUserPrompter {
  constructor(private store: Store) {}

  getDefaultChainId(): number {
    return 1
  }

  async promptChangeNetwork(): Promise<boolean> {
    return true
  }

  async promptConfirmWalletDeploy(): Promise<boolean> {
    return true
  }

  async promptConnect(options?: ConnectOptions): Promise<PromptConnectDetails> {
    console.log('promptconnect', options)

    const account = this.store.get(AuthStore).account
    // Ignore error as likely caused by versioning of @0xsequence/account
    await this.store.get(WalletStore).walletRequestHandler.signIn(account ?? null)

    if (options) {
      this.store.get(WalletStore).walletRequestHandler.setConnectOptions(options)
    }

    // this.store.get(RouterStore).navigate('/connect', { state: { dappInitiatedRequest: true } })

    return new Promise((resolve, reject) => {
      const unsubscribe = this.store.get(WalletStore).connectDetails.subscribe(connectDetails => {
        unsubscribe()

        if (!connectDetails || !connectDetails.connected) {
          reject(`connect cancelled by user`)
        } else {
          // if (options?.askForEmail) {
          //   const userEmail = this.store.get(AuthStore).loginDetails.get()?.email
          //   connectDetails.email = userEmail
          // }

          resolve(connectDetails)
        }
      })
    })
  }

  async promptSignInConnect(options?: ConnectOptions): Promise<PromptConnectDetails> {
    console.log('prompt sign in connect:', options)

    return new Promise((resolve, reject) => {
      resolve({ connected: false })
    })
  }

  async promptSignMessage(message: MessageToSign, options?: ConnectOptions): Promise<string> {
    console.log('prompt sign message:', message, options)

    return new Promise((resolve, reject) => {
      resolve('')
    })
  }

  promptSignTransaction(
    txn: commons.transaction.Transactionish,
    chainId?: number,
    options?: ConnectOptions
  ): Promise<string> {
    console.log('prompt sign transaction:', txn, chainId, options)
    const accountAddress = this.store.get(AuthStore).accountAddress.get()

    if (!accountAddress) {
      throw new Error('Unknown account address')
    }

    const transactions = commons.transaction.fromTransactionish(accountAddress, txn)

    console.log('prompt sign txn:', transactions, chainId, options)

    //TODO implement multiple transaction handling

    validateTransactionRequest(accountAddress, txn)

    return new Promise((resolve, reject) => {
      this.store.get(WalletStore).toSignTxnDetails.set({ txn, chainId, options })
      this.store.get(WalletStore).isSigningTransaction.set(true)

      const unsubscribe = this.store.get(WalletStore).toSignTxnPermission.subscribe(() => {
        unsubscribe()

        const status = this.store.get(WalletStore).toSignTxnPermission.get()
        this.store.get(WalletStore).toSignTxnPermission.set(undefined)

        if (!status || status === 'cancelled') {
          reject('request failed')
        } else {
          const result = this.store.get(WalletStore).toSignTxnResult.get()
          if (result) {
            resolve(result.hash)
          }
        }
      })
    })
  }

  promptSendTransaction(
    txn: commons.transaction.Transactionish,
    chainId?: number,
    options?: ConnectOptions
  ): Promise<string> {
    return this.promptSignTransaction(txn, chainId, options)
  }
}
