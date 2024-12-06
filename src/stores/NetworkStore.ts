import { NetworkConfig, networks } from '@0xsequence/network'
import { LocalRelayer } from '@0xsequence/relayer'
import { ethers, isError } from 'ethers'
import { WritableObservable } from 'micro-observables'

import { DEFAULT_TRACKER_OPTIONS, TRACKER_OPTIONS } from '~/utils/tracker'

import { DEFAULT_PUBLIC_RPC_LIST, IGNORED_CHAIN_IDS } from '~/constants/network'
import { LocalStorageKey } from '~/constants/storage'

import { Store, observable } from '.'
import { LocalStore } from './LocalStore'

// THROWAWAY_RELAYER_PK is the private key to an account with some ETH on Rinkeby we can use for debugging.
//
// Public account address: 0x9e7fFFfA6bdD755e4dE6659677145782D9dF1a4e
// Etherscan link: https://rinkeby.etherscan.io/address/0x9e7fFFfA6bdD755e4dE6659677145782D9dF1a4e
const THROWAWAY_RELAYER_PK = '0xa9e1f06cb24d160e02bd6ea84d6ffd0b3457b53d1177382eee85f4d8013419b8'

export const createDebugLocalRelayer = (provider: string | ethers.JsonRpcProvider) => {
  const signer = new ethers.Wallet(THROWAWAY_RELAYER_PK)
  if (typeof provider === 'string') {
    return new LocalRelayer(signer.connect(new ethers.JsonRpcProvider(provider)))
  } else {
    return new LocalRelayer(signer.connect(provider))
  }
}

export class NetworkStore {
  networks = observable<NetworkConfig[]>([])

  editedNetworkChainIds = observable<number[]>([])
  userAdditionNetworkChainIds = observable<number[]>([])

  arweaveGatewayUrl: WritableObservable<string | undefined>
  arweaveGraphqlUrl: WritableObservable<string | undefined>

  accountLoaded = observable<boolean>(false)

  private local = {
    networksUserEdits: new LocalStore<NetworkConfig[]>(LocalStorageKey.NETWORKS_USER_EDITS),
    networksUserAdditions: new LocalStore<NetworkConfig[]>(LocalStorageKey.NETWORKS_USER_ADDITIONS),
    arweaveGatewayUrl: new LocalStore<string>(LocalStorageKey.ARWEAVE_GATEWAY_URL),
    arweaveGraphqlUrl: new LocalStore<string>(LocalStorageKey.ARWEAVE_GRAPHQL_URL)
  }

  unsavedNetworkEdits = observable<NetworkConfig[]>([])
  unsavedNetworkEditChainIds = observable<number[]>([])
  unsavedArweaveURLs = observable<{ gatewayUrl?: string; graphQLUrl?: string }>({})

  isAddingNetwork = observable<boolean>(false)

  constructor(_store: Store) {
    this.prepareNetworks()

    this.accountLoaded.subscribe(loaded => {
      if (loaded && this.networks.get().length === 0) {
        this.prepareNetworks()
      }
    })

    this.arweaveGatewayUrl = this.local.arweaveGatewayUrl.observable
    this.arweaveGraphqlUrl = this.local.arweaveGraphqlUrl.observable

    if (!this.arweaveGatewayUrl.get()) {
      this.arweaveGatewayUrl.set(DEFAULT_TRACKER_OPTIONS.arweaveUrl)
    }
    if (!this.arweaveGraphqlUrl.get()) {
      this.arweaveGraphqlUrl.set(DEFAULT_TRACKER_OPTIONS.graphqlUrl)
    }

    TRACKER_OPTIONS.arweaveUrl = this.arweaveGatewayUrl.get() || DEFAULT_TRACKER_OPTIONS.arweaveUrl
    TRACKER_OPTIONS.graphqlUrl = this.arweaveGraphqlUrl.get() || DEFAULT_TRACKER_OPTIONS.graphqlUrl

    this.arweaveGatewayUrl.subscribe(value => {
      TRACKER_OPTIONS.arweaveUrl = value || DEFAULT_TRACKER_OPTIONS.arweaveUrl
    })
    this.arweaveGraphqlUrl.subscribe(value => {
      TRACKER_OPTIONS.graphqlUrl = value || DEFAULT_TRACKER_OPTIONS.graphqlUrl
    })
  }

  private async prepareNetworks() {
    const updatedNetworkConfigs: NetworkConfig[] = []

    var userEdits = this.local.networksUserEdits.get()

    for (const [key, value] of Object.entries(networks)) {
      if (IGNORED_CHAIN_IDS.has(Number(key))) {
        continue
      }

      if (value.deprecated) {
        continue
      }

      const updatedNetworkConfig = value as NetworkConfig

      const rpcForCurrent = DEFAULT_PUBLIC_RPC_LIST.get(Number(key))?.[1]

      const userEdit = userEdits?.find(network => network.chainId === updatedNetworkConfig.chainId)

      if (userEdit) {
        if (
          userEdit.rpcUrl !== rpcForCurrent ||
          userEdit.blockExplorer?.rootUrl !== updatedNetworkConfig.blockExplorer?.rootUrl ||
          userEdit.disabled !== false
        ) {
          userEdit.relayer = createDebugLocalRelayer(userEdit.rpcUrl)
          updatedNetworkConfigs.push(userEdit)
          continue
        } else {
          userEdits = userEdits?.filter(n => n.chainId !== updatedNetworkConfig.chainId)
          this.local.networksUserEdits.set(userEdits)
        }
      }

      if (rpcForCurrent) {
        updatedNetworkConfig.rpcUrl = rpcForCurrent
        updatedNetworkConfig.relayer = createDebugLocalRelayer(rpcForCurrent)

        updatedNetworkConfig.disabled = false

        updatedNetworkConfigs.push(updatedNetworkConfig)
      } else {
        console.warn(
          `No RPC found for network ${value.name} - chain ID ${key}. You can ignore this warning if the network is deprecated.`
        )
      }
    }

    this.local.networksUserAdditions.get()?.forEach(network => {
      network.relayer = createDebugLocalRelayer(network.rpcUrl)
      updatedNetworkConfigs.push(network)
    })

    this.editedNetworkChainIds.set(userEdits?.map(n => n.chainId) ?? [])
    this.userAdditionNetworkChainIds.set(this.local.networksUserAdditions.get()?.map(n => n.chainId) ?? [])

    this.networks.set(updatedNetworkConfigs)
  }

  async isValidRpcUrl(rpcUrl: string) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl)
      provider.on('error', e => {
        if (isError(e, 'NETWORK_ERROR')) {
          provider.destroy()
        }
      })
      await provider.getBlockNumber()
      return true
    } catch (error) {
      console.error(`Invalid RPC URL (${rpcUrl}):`, error)
      return false
    }
  }

  networkForChainId(chainId: number) {
    return this.networks.get().find(n => n.chainId === chainId)
  }

  providerForChainId(chainId: number) {
    const network = this.networkForChainId(chainId)?.rpcUrl
    if (!network) {
      throw new Error(`No network found for chainId ${chainId}`)
    }
    const provider = new ethers.JsonRpcProvider(network)
    if (!provider) {
      throw new Error(`No provider found for chainId ${chainId}`)
    }
    return provider
  }

  editNetwork(network: NetworkConfig) {
    const userEdits = this.local.networksUserEdits.get() ?? []

    if (userEdits.some(n => n.chainId === network.chainId)) {
      const update = userEdits.map(n => (n.chainId !== network.chainId ? n : network))
      this.local.networksUserEdits.set(update)
    } else {
      userEdits.push(network)
      this.local.networksUserEdits.set(userEdits)
    }

    this.prepareNetworks()
  }

  async editUserNetwork(network: NetworkConfig) {
    const userNetworks = this.local.networksUserAdditions.get() ?? []

    const filtered = userNetworks.filter(n => n.chainId !== network.chainId)
    filtered.push(network)
    this.local.networksUserAdditions.set(filtered)

    this.prepareNetworks()
  }

  addUnsavedNetworkEdit(network: NetworkConfig) {
    const existingUnsaved = this.unsavedNetworkEdits.get() || []
    const chainIds = this.unsavedNetworkEditChainIds.get()
    const saved = this.networks.get()

    if (
      saved.some(n => {
        return (
          n.chainId === network.chainId &&
          n.rpcUrl === network.rpcUrl &&
          n.blockExplorer?.rootUrl === network.blockExplorer?.rootUrl &&
          n.disabled === network.disabled
        )
      })
    ) {
      this.unsavedNetworkEdits.set(existingUnsaved.filter(n => n.chainId !== network.chainId))
      this.unsavedNetworkEditChainIds.set(chainIds.filter(id => id !== network.chainId))
      return
    }

    if (existingUnsaved.some(n => n.chainId === network.chainId)) {
      this.unsavedNetworkEdits.set(existingUnsaved.map(n => (n.chainId !== network.chainId ? n : network)))
    } else {
      this.unsavedNetworkEdits.set([...existingUnsaved, network])
      this.unsavedNetworkEditChainIds.set([...chainIds, network.chainId])
    }
  }

  addUnsavedArweaveURLs(gatewayUrl: string, graphQLUrl: string) {
    this.unsavedArweaveURLs.set({ gatewayUrl, graphQLUrl })
  }

  discardUnsavedNetworkEdits() {
    this.unsavedNetworkEdits.set([])
    this.unsavedNetworkEditChainIds.set([])
    this.unsavedArweaveURLs.set({})
  }

  saveUnsavedNetworkEdits() {
    const unsavedArweaveURLs = this.unsavedArweaveURLs.get()

    if (unsavedArweaveURLs) {
      this.local.arweaveGatewayUrl.set(unsavedArweaveURLs.gatewayUrl)
      this.local.arweaveGraphqlUrl.set(unsavedArweaveURLs.graphQLUrl)
    }

    for (const network of this.unsavedNetworkEdits.get() || []) {
      if (this.userAdditionNetworkChainIds.get()?.includes(network.chainId)) {
        this.editUserNetwork(network)
      } else {
        this.editNetwork(network)
      }
    }
    this.unsavedNetworkEdits.set([])
    this.unsavedNetworkEditChainIds.set([])
    this.unsavedArweaveURLs.set({})
  }

  resetNetworkEdit(chainId: number) {
    const userEdits = this.local.networksUserEdits.get()

    const filtered = userEdits?.filter(n => n.chainId !== chainId)

    this.local.networksUserEdits.set(filtered)

    this.prepareNetworks()
  }

  async addNetwork(network: NetworkConfig) {
    const userNetworks = this.local.networksUserAdditions.get() ?? []

    const alreadyExists = this.networks.get().some(n => n.chainId === network.chainId)

    if (alreadyExists) {
      throw new Error(`Network with chainId ${network.chainId} already exists`)
    }

    userNetworks.push(network)
    this.local.networksUserAdditions.set(userNetworks)

    this.prepareNetworks()
  }

  removeNetwork(chainId: number) {
    const userNetworks = this.local.networksUserAdditions.get()

    const filtered = userNetworks?.filter(n => n.chainId !== chainId)

    this.local.networksUserAdditions.set(filtered)

    this.prepareNetworks()
  }

  clear() {
    this.local.networksUserAdditions.set([])
    this.local.networksUserEdits.set([])

    this.networks.set([])
    this.editedNetworkChainIds.set([])
    this.userAdditionNetworkChainIds.set([])

    this.prepareNetworks()

    this.arweaveGatewayUrl.set(undefined)
    this.arweaveGraphqlUrl.set(undefined)
    this.accountLoaded.set(false)
  }
}
