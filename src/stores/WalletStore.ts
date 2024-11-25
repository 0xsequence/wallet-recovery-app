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

import { observable, useStore } from '~/stores'

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
  accountAddress = this.authStore.accountAddress.get()

  availableExternalProviders = observable<ProviderDetail[]>([])
  selectedExternalProvider = observable<ProviderDetail | undefined>(undefined)
  selectedExternalWalletAddress = observable<string | undefined>(undefined)

  isSendingTokenTransaction = observable<
    { tokenBalance: TokenBalance; to: string; amount?: string } | undefined
  >(undefined)
  isSendingCollectibleTransaction = observable<
    { collectibleInfo: CollectibleInfo; to: string; amount?: string } | undefined
  >(undefined)
  isSendingSignedTokenTransaction = observable<
    | { txn: ethers.Transaction[] | ethers.TransactionRequest[]; chainId: number; options: ConnectOptions }
    | undefined
  >(undefined)

  connectDetails = observable<PromptConnectDetails | undefined>(undefined)
  connectOptions = observable<NetworkedConnectOptions | undefined>(undefined)

  isSigningTxn = observable<boolean>(false)
  isSigningMsg = observable<boolean>(false)
  toSignPermission = observable<'approved' | 'cancelled' | undefined>(undefined)
  toSignResult = observable<{ hash: string } | undefined>(undefined)

  toSignTxnDetails = observable<
    | { txn: ethers.Transaction[] | ethers.TransactionRequest[]; chainId: number; options: ConnectOptions }
    | undefined
  >(undefined)
  toSignMsgDetails = observable<
    { message: MessageToSign; chainId: number; options?: ConnectOptions } | undefined
  >(undefined)

  isCheckingWalletDeployment = observable<boolean>(false)
  walletNotDeployed = observable<boolean>(false)

  walletRequestHandler: WalletRequestHandler

  private local = {
    lastConnectedExternalProviderInfo: new LocalStore<ProviderInfo>(
      LocalStorageKey.LAST_CONNECTED_EXTERNAL_PROVIDER_INFO
    )
  }

  defaultNetwork = new LocalStore<number>(LocalStorageKey.DEFAULT_NETWORK)

  constructor(private store: Store) {
    this.walletRequestHandler = new WalletRequestHandler(
      undefined, // signer is set after wallet is initialized / signed in
      new Prompter(store),
      // WARNING: ignore error caused by version mismatch
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
    // WARNING: ignore error caused by version mismatch
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

      const provider = this.store.get(NetworkStore).providerForChainId(chainId)

      this.isSendingTokenTransaction.set({ tokenBalance, to, amount })

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

      const provider = this.store.get(NetworkStore).providerForChainId(chainId)

      this.isSendingCollectibleTransaction.set({ collectibleInfo, to, amount })

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

  resetSignObservables = () => {
    this.isSigningTxn.set(false)
    this.toSignTxnDetails.set(undefined)
    this.toSignMsgDetails.set(undefined)
    this.toSignPermission.set(undefined)
    this.toSignResult.set(undefined)
  }

  checkWalletDeployment = async (chainId: number): Promise<boolean> => {
    const account = this.store.get(AuthStore).account
    if (!account) {
      throw new Error('No account found')
    }

    const status = await account.status(chainId)
    return status.onChain.deployed
  }

  async sendTransaction(
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

    await this.switchToChain(externalProvider, chainId)

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

  async getExternalProviderAddress(provider: EIP1193Provider | EthereumProvider): Promise<string> {
    const accounts = await this.getExternalProviderAccounts(provider)
    return accounts[0]
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
    return this.store.get(WalletStore).defaultNetwork.get() ?? 1
  }

  async promptChangeNetwork(chainId: number): Promise<boolean> {
    const supportedNetworks = this.store.get(NetworkStore).networks.get()
    if (supportedNetworks.some(network => network.chainId === chainId)) {
      this.store.get(WalletStore).defaultNetwork.set(chainId)
      return true
    }
    return false
  }

  async promptConfirmWalletDeploy(chainId: number, options?: ConnectOptions): Promise<boolean> {
    console.log('prompt confirm wallet deploy:', chainId, options)

    if (!chainId) {
      return Promise.resolve(false)
    }

    // checks if wallet is deployed on chain

    const isDeployed = await this.store.get(WalletStore).checkWalletDeployment(chainId)

    return new Promise((resolve, _) => {
      if (isDeployed) {
        resolve(true)
      } else {
        resolve(false)
      }
    })
  }

  async promptConnect(options?: ConnectOptions): Promise<PromptConnectDetails> {
    console.log('promptconnect', options)

    const account = this.store.get(AuthStore).account
    // WARNING: ignore error caused by version mismatch
    await this.store.get(WalletStore).walletRequestHandler.signIn(account ?? null)

    if (options) {
      this.store.get(WalletStore).walletRequestHandler.setConnectOptions(options)
    }

    return new Promise((resolve, reject) => {
      const unsubscribe = this.store.get(WalletStore).connectDetails.subscribe(connectDetails => {
        unsubscribe()

        if (!connectDetails || !connectDetails.connected) {
          reject(`connect cancelled by user`)
        } else {
          resolve(connectDetails)
        }
      })
    })
  }

  async promptSignInConnect(options?: ConnectOptions): Promise<PromptConnectDetails> {
    // I think we should be good with not implementing this since the recovery wallet requires the user to authenticate first
    console.log('prompt sign in connect:', options)
    return { connected: false }
  }

  async promptSignMessage(message: MessageToSign, options: ConnectOptions): Promise<string> {
    console.log('prompt sign message:', message, options)

    if (!message.chainId) {
      return Promise.reject('No chainId found in message')
    }

    if (message.eip6492 !== true) {
      // This means we aren't going to sign using EIP-6492
      // so we need to make sure the wallet can sign onchain

      // const status = await this.store.get(WalletStore).wallet!.status(chainid)

      const status = await this.store.get(AuthStore).account!.status(message.chainId)

      if (!status.canOnchainValidate) {
        const res = await this.promptConfirmWalletDeploy(message.chainId, options)

        if (!res) {
          this.store.get(WalletStore).walletNotDeployed.set(true)
          return Promise.reject('User rejected wallet deploy request')
        }
      }
    }

    this.store.get(WalletStore).isSigningMsg.set(true)
    this.store.get(WalletStore).toSignMsgDetails.set({ message, chainId: message.chainId, options })

    return new Promise((resolve, reject) => {
      const unsubscribe = this.store.get(WalletStore).toSignPermission.subscribe(() => {
        unsubscribe()
        const status = this.store.get(WalletStore).toSignPermission.get()
        this.store.get(WalletStore).toSignPermission.set(undefined)
        if (!status || status === 'cancelled') {
          reject('request failed')
        } else {
          const result = this.store.get(WalletStore).toSignResult.get()
          if (result) {
            resolve(result.hash)
          }
        }
      })
    })
  }

  promptSignTransaction(
    txn: commons.transaction.Transactionish,
    chainId: number,
    options: ConnectOptions
  ): Promise<string> {
    console.log('prompt sign transaction:', txn, chainId, options)

    let newTxn: ethers.Transaction[] | ethers.TransactionRequest[]
    if (Array.isArray(txn)) {
      newTxn = txn
    } else {
      newTxn = [txn]
    }

    const accountAddress = this.store.get(AuthStore).accountAddress.get()

    if (!accountAddress) {
      throw new Error('Unknown account address')
    }

    const transactions = commons.transaction.fromTransactionish(accountAddress, newTxn)

    console.log('prompt sign txn:', transactions, chainId, options)

    // TODO find out if we need to implement multiple transaction handling

    validateTransactionRequest(accountAddress, newTxn)

    return new Promise((resolve, reject) => {
      this.store.get(WalletStore).toSignTxnDetails.set({ txn: newTxn, chainId, options })
      this.store.get(WalletStore).isSigningTxn.set(true)

      const unsubscribe = this.store.get(WalletStore).toSignPermission.subscribe(() => {
        unsubscribe()

        const status = this.store.get(WalletStore).toSignPermission.get()
        this.store.get(WalletStore).toSignPermission.set(undefined)

        if (!status || status === 'cancelled') {
          reject('request failed')
        } else {
          const result = this.store.get(WalletStore).toSignResult.get()
          if (result) {
            resolve(result.hash)
          }
        }
      })
    })
  }

  promptSendTransaction(
    txn: commons.transaction.Transactionish,
    chainId: number,
    options: ConnectOptions
  ): Promise<string> {
    return this.promptSignTransaction(txn, chainId, options)
  }
}
