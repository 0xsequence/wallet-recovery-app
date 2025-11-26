import { ChainId, NetworkMetadata, networks as sequenceNetworkDefs } from '@0xsequence/network'
import { Relayer } from '@0xsequence/relayer'
import { Bundler, State } from '@0xsequence/wallet-core'
import { Network } from '@0xsequence/wallet-primitives'
import { Sequence } from '@0xsequence/wallet-wdk'
import {
  Chain,
  apeChain,
  arbitrum,
  arbitrumNova,
  arbitrumSepolia,
  avalanche,
  avalancheFuji,
  b3,
  b3Sepolia,
  base,
  baseSepolia,
  blast,
  blastSepolia,
  bsc,
  bscTestnet,
  etherlink,
  etherlinkTestnet,
  gnosis,
  immutableZkEvm,
  immutableZkEvmTestnet,
  katana,
  mainnet,
  monadTestnet,
  moonbaseAlpha,
  moonbeam,
  optimism,
  optimismSepolia,
  polygon,
  polygonAmoy,
  polygonZkEvm,
  sepolia,
  somniaTestnet,
  soneium,
  soneiumMinato,
  telos,
  telosTestnet,
  xai
} from 'viem/chains'

// import { config } from './config'

// import { env, getBundlerUrl, getRelayerUrl, getRpcUrl } from './env'

let stateProvider: State.Provider | undefined

const localStateProvider = new State.Local.Provider(new State.Local.IndexedDbStore('sequence-cache'))

// if (!env.KEYMACHINE_URL) {
//   console.error(
//     'VITE_KEYMACHINE_URL is not segert. Using local state provider.'
//   )
//   stateProvider = localStateProvider
// } else {
//   stateProvider = new State.Cached({
//     source: new State.Sequence.Provider(env.KEYMACHINE_URL),
//     cache: localStateProvider,
//   })
// }

// Create a RpcRelayer from a chainId with the configured rpc and relayer urls
// const createRpcRelayer = (chainId: number) => {
//   const rpcUrl = getRpcUrl(chainId)
//   const relayerUrl = getRelayerUrl(chainId)

//   return new Relayer.RpcRelayer(relayerUrl, chainId, rpcUrl)
// }

// const createPimlicoBundler = (chainId: number) => {
//   const rpcUrl = getRpcUrl(chainId)
//   const bundlerUrl = getBundlerUrl(chainId)
//   return new Bundler.Bundlers.PimlicoBundler(bundlerUrl, rpcUrl)
// }

// Create a Network object from a viem Chain object
const createNetwork = (chain: Chain): Network.Network => ({
  chainId: chain.id,
  type: chain.testnet
    ? Network.NetworkType.TESTNET
    : Network.NetworkType.MAINNET,
  name: chain.name,
  rpcUrl: chain.rpcUrls.default.http[0],
  blockExplorer: chain.blockExplorers?.default,
  nativeCurrency: chain.nativeCurrency,
})

// Create a viem Chain from Sequence NetworkMetadata
// const createChainFromSequenceNetwork = (chainId: ChainId): Chain => {
//   const network: NetworkMetadata = sequenceNetworkDefs[chainId]
//   if (!network) {
//     throw new Error(
//       `Network with chainId ${chainId} not found in Sequence networks`
//     )
//   }

//   return {
//     id: Number(network.chainId),
//     name: network.name,
//     nativeCurrency: {
//       name: network.nativeToken.name,
//       symbol: network.nativeToken.symbol,
//       decimals: network.nativeToken.decimals,
//     },
//     rpcUrls: {
//       default: { http: [getRpcUrl(Number(network.chainId))] },
//     },
//     blockExplorers: network.blockExplorer
//       ? {
//           default: {
//             name: network.blockExplorer.name || 'Explorer',
//             url: network.blockExplorer.rootUrl,
//           },
//         }
//       : undefined,
//     testnet: network.type === 'testnet' || !!network.testnet,
//   } as Chain
// }

const networks = [
  // Ethereum
  mainnet,
  sepolia,
  // Polygon
  polygon,
  polygonZkEvm,
  polygonAmoy,
  // BSC
  bsc,
  bscTestnet,
  // Optimism
  optimism,
  optimismSepolia,
  // Arbitrum
  arbitrum,
  arbitrumSepolia,
  arbitrumNova,
  // Avalanche
  avalanche,
  avalancheFuji,
  // Gnosis
  gnosis,
  // Base
  base,
  baseSepolia,
  // Xai
  xai,
  // Telos
  telos,
  telosTestnet,
  // B3
  b3,
  b3Sepolia,
  // Ape Chain
  apeChain,
  // Blast
  blast,
  blastSepolia,
  // Immutable zkEVM
  immutableZkEvm,
  immutableZkEvmTestnet,
  // Etherlink
  etherlink,
  etherlinkTestnet,
  // Moonbeam
  moonbeam,
  moonbaseAlpha,
  // Monad
  monadTestnet,
  // Somnia
  somniaTestnet,
  // Katana
  katana,
  // Soneium
  soneium,
  soneiumMinato
].map(createNetwork)

// Additional networks that aren't in Viem
// const sequenceNetworks = [
//   // Homeverse
//   ChainId.HOMEVERSE,
//   ChainId.HOMEVERSE_TESTNET,
//   // TOY
//   ChainId.TOY_TESTNET
// ]
//   // .map(chainId => createChainFromSequenceNetwork(chainId))
//   .map(createNetwork)

// Combine all networks
const allNetworks = [...networks]

// const googleClientId = config.providerConfig.find(
//   provider => provider.type === 'GOOGLE'
// )?.clientId
// const appleClientId = config.providerConfig.find(
//   provider => provider.type === 'APPLE'
// )?.clientId

export const manager = new Sequence.Manager({
  networks: allNetworks,
  // relayers: [
  //   // Relayer.Local.LocalRelayer.createFromWindow(window)!,
  //   ...allNetworks.map(network => createRpcRelayer(Number(network.chainId))),
  // ],
  // bundlers: [
  //   ...allNetworks.map(network =>
  //     createPimlicoBundler(Number(network.chainId))
  //   ),
  // ],
  multiInjectedProviderDiscovery: true,
  stateProvider,
  // guardUrl: env.GUARD_URL,
  defaultRecoverySettings: {
    requiredDeltaTime: 2592000n, // 30 days (in seconds)
    minTimestamp: 0n
  }
  // guardAddresses: {
  //   wallet: env.GUARD_WALLET_ADDRESS,
  //   sessions: env.GUARD_SESSIONS_ADDRESS,
  // },
  // identity: {
  //   url: env.IDENTITY_INSTRUMENT_URL,
  //   scope: env.IDENTITY_INSTRUMENT_SCOPE,
  //   verifyAttestation: true,
  //   email: {
  //     enabled: true,
  //   },
  //   google: googleClientId
  //     ? {
  //         enabled: true,
  //         clientId: googleClientId,
  //       }
  //     : undefined,
  //   apple: appleClientId
  //     ? {
  //         enabled: true,
  //         clientId: appleClientId,
  //       }
  //     : undefined,
  // },
})
