// Picked from https://chainlist.org/
export const DEFAULT_PUBLIC_RPC_LIST: Map<number, [string | undefined, string]> = new Map([
  [1, ['mainnet', 'https://ethereum-rpc.publicnode.com']],
  [11155111, ['sepolia', 'https://ethereum-sepolia-rpc.publicnode.com']],
  [137, ['polygon', 'https://polygon-bor-rpc.publicnode.com']],
  [80002, ['polygon-amoy', 'https://rpc-amoy.polygon.technology']], // not on sequence directory repo
  [1101, ['polygon-zkevm', 'https://zkevm-rpc.com']],
  [56, ['bnb', 'https://bsc-rpc.publicnode.com']],
  [97, ['bnb-testnet', 'https://bsc-testnet-rpc.publicnode.com']],
  [10, ['optimism', 'https://optimism-rpc.publicnode.com']],
  [11155420, ['optimism-sepolia', 'https://sepolia.optimism.io']],
  [42161, ['arbitrum', 'https://arb1.arbitrum.io/rpc']],
  [421614, ['arbitrum-sepolia', 'https://sepolia-rollup.arbitrum.io/rpc']],
  [42170, ['arbitrum-nova', 'https://arbitrum-nova.publicnode.com']],
  [43114, ['avalanche', 'https://avalanche-c-chain-rpc.publicnode.com']],
  [43113, ['avalanche-testnet', 'https://avalanche-fuji-c-chain-rpc.publicnode.com']],
  [100, ['gnosis', 'https://gnosis-pokt.nodies.app']],
  [8453, ['base', 'https://mainnet.base.org']],
  [84532, ['base-sepolia', 'https://base-sepolia-rpc.publicnode.com']],
  [19011, ['homeverse', 'https://rpc.mainnet.oasys.homeverse.games']],
  [40875, ['homeverse-testnet', 'https://rpc.testnet.oasys.homeverse.games']],
  [660279, ['xai', 'https://xai-chain.net/rpc']], // not on sequence directory repo
  [37714555429, ['xai-testnet', 'https://testnet-v2.xai-chain.net/rpc']], // not on sequence directory repo
  [3776, ['astar-zkevm', 'https://rpc.startale.com/astar-zkevm']],
  [6038361, ['astar-zkyoto', 'https://rpc.startale.com/zkyoto']],
  [2730, ['xr-sepolia-testnet', 'https://xr-sepolia-testnet.rpc.caldera.xyz/http']], // not on sequence directory repo
  [40, ['telos', 'https://mainnet.telos.net/evm']], // not on sequence directory repo
  [1946, ['minato', 'https://rpc.minato.soneium.org']], // not on sequence directory repo
  [7668, ['rootnet', 'https://root.rootnet.live/archive']], // not on sequence directory repo
  [8333, ['b3', 'https://mainnet-rpc.b3.fun']], // not on sequence directory repo
  [13371, ['immutable', 'https://rpc.immutable.com']], // not on sequence directory repo
  [33139, ['apechain', 'https://rpc.apechain.com']], // not on sequence directory repo
  [81457, ['blast', 'https://blast-rpc.publicnode.com']], // not on sequence directory repo
  [33111, ['curtis', 'https://rpc.curtis.apechain.com']], // not on sequence directory repo
  [1482601649, ['green-giddy-denebola', 'https://mainnet.skalenodes.com/v1/green-giddy-denebola']], // not on sequence directory repo
  [37084624, ['lanky-ill-funny-testnet', 'https://testnet.skalenodes.com/v1/lanky-ill-funny-testnet']], // not on sequence directory repo
  [13473, ['immutable', 'https://rpc.immutable.com']], // not on sequence directory repo
  [7672, ['porcini', 'https://porcini.rootnet.app/archive']] // not on sequence directory repo
])

// These are hardhat test networks
export const IGNORED_CHAIN_IDS = new Set([31337, 31338])
