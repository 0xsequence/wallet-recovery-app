import { Network } from '@0xsequence/wallet-primitives'

import { DEFAULT_PUBLIC_RPC_LIST } from '~/constants/network'

/**
 * Get the public RPC URL for a given chain ID
 * @param chainId - The chain ID to get the RPC URL for
 * @returns The public RPC URL, or throws an error if not found
 */
function getRpcUrl(chainId: number): string {
  const rpcUrl = DEFAULT_PUBLIC_RPC_LIST.get(chainId)?.[1]
  if (!rpcUrl) {
    return ''
  }
  return rpcUrl
}

export const networks = [
  Network.ChainId.MAINNET,
  Network.ChainId.SEPOLIA,
  Network.ChainId.POLYGON,
  Network.ChainId.POLYGON_AMOY,
  Network.ChainId.BSC,
  Network.ChainId.BSC_TESTNET,
  Network.ChainId.OPTIMISM,
  Network.ChainId.OPTIMISM_SEPOLIA,
  Network.ChainId.ARBITRUM,
  Network.ChainId.ARBITRUM_SEPOLIA,
  Network.ChainId.ARBITRUM_NOVA,
  Network.ChainId.AVALANCHE,
  Network.ChainId.AVALANCHE_TESTNET,
  Network.ChainId.GNOSIS,
  Network.ChainId.BASE,
  Network.ChainId.BASE_SEPOLIA,
  Network.ChainId.TELOS,
  Network.ChainId.TELOS_TESTNET,
  Network.ChainId.APECHAIN,
  Network.ChainId.APECHAIN_TESTNET,
  Network.ChainId.SKALE_NEBULA,
  Network.ChainId.ETHERLINK,
  Network.ChainId.ETHERLINK_SHADOWNET_TESTNET,
  Network.ChainId.SOMNIA_TESTNET,
  Network.ChainId.KATANA,
  Network.ChainId.SONEIUM,
  Network.ChainId.SONEIUM_MINATO,
  Network.ChainId.SOMNIA,
  Network.ChainId.MONAD,
  Network.ChainId.ARC_TESTNET,
  Network.ChainId.HYPEREVM,
  Network.ChainId.BERACHAIN,
  Network.ChainId.SONIC
].map(chainId => {
  const network = Network.getNetworkFromChainId(chainId)

  if (!network) {
    throw new Error(`Network with chainId ${chainId} not found`)
  }

  return { ...network, rpcUrl: getRpcUrl(network.chainId) }
})
