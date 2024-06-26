import { NetworkConfig, networks } from '@0xsequence/network'
import { LocalRelayer } from '@0xsequence/relayer'
import { ethers } from 'ethers'

import { DEFAULT_PUBLIC_RPC_LIST, IGNORED_CHAIN_IDS } from '~/constants/network'
import { LocalStorageKey } from '~/constants/storage'

import { Store, observable } from '.'
import { LocalStore } from './LocalStore'

// THROWAWAY_RELAYER_PK is the private key to an account with some ETH on Rinkeby we can use for debugging.
//
// Public account address: 0x9e7fFFfA6bdD755e4dE6659677145782D9dF1a4e
// Etherscan link: https://rinkeby.etherscan.io/address/0x9e7fFFfA6bdD755e4dE6659677145782D9dF1a4e
const THROWAWAY_RELAYER_PK = '0xa9e1f06cb24d160e02bd6ea84d6ffd0b3457b53d1177382eee85f4d8013419b8'

export const createDebugLocalRelayer = (provider: string | ethers.providers.JsonRpcProvider) => {
  const signer = new ethers.Wallet(THROWAWAY_RELAYER_PK)
  if (typeof provider === 'string') {
    return new LocalRelayer(signer.connect(new ethers.providers.JsonRpcProvider(provider)))
  } else {
    return new LocalRelayer(signer.connect(provider))
  }
}

export class NetworkStore {
  networks = observable<NetworkConfig[]>([])

  editedNetworkChainIds = observable<number[]>([])
  userAdditionNetworkChainIds = observable<number[]>([])

  private local = {
    networksUserEdits: new LocalStore<NetworkConfig[]>(LocalStorageKey.NETWORKS_USER_EDITS),
    networksUserAdditions: new LocalStore<NetworkConfig[]>(LocalStorageKey.NETWORKS_USER_ADDITIONS)
  }

  constructor(private store: Store) {
    this.prepareNetworks()
  }

  private async prepareNetworks() {
    const updatedNetworkConfigs: NetworkConfig[] = []

    const userEdits = this.local.networksUserEdits.get()

    for (const [key, value] of Object.entries(networks)) {
      if (IGNORED_CHAIN_IDS.has(Number(key))) {
        continue
      }

      const updatedNetworkConfig = value as NetworkConfig

      const userEdit = userEdits?.find(network => network.chainId === updatedNetworkConfig.chainId)

      if (userEdit) {
        userEdit.relayer = createDebugLocalRelayer(userEdit.rpcUrl)
        updatedNetworkConfigs.push(userEdit)
        continue
      }

      const rpcForCurrent = DEFAULT_PUBLIC_RPC_LIST.get(Number(key))

      if (rpcForCurrent) {
        updatedNetworkConfig.rpcUrl = rpcForCurrent
        updatedNetworkConfig.relayer = createDebugLocalRelayer(rpcForCurrent)

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
  }
}
