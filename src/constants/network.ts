// Picked from https://chainlist.org/
export const DEFAULT_PUBLIC_RPC_LIST: Map<number, string> = new Map([
  [1, 'https://eth.llamarpc.com'],
  [11155111, 'https://ethereum-sepolia-rpc.publicnode.com'],
  [137, 'https://polygon.drpc.org'],
  [80002, 'https://polygon-amoy.drpc.org'],
  [1101, 'https://zkevm-rpc.com'],
  [56, 'https://bsc-rpc.publicnode.com'],
  [97, 'https://bsc-testnet-rpc.publicnode.com'],
  [10, 'https://optimism.llamarpc.com'],
  [11155420, 'https://optimism-sepolia.drpc.org'],
  [42161, 'https://arbitrum.llamarpc.com'],
  [421614, 'https://sepolia-rollup.arbitrum.io/rpc'],
  [42170, 'https://arbitrum-nova.publicnode.com'],
  [43114, 'https://avalanche-c-chain-rpc.publicnode.com'],
  [43113, 'https://avalanche-fuji-c-chain-rpc.publicnode.com'],
  [100, 'https://gnosis-pokt.nodies.app'],
  [8453, 'https://base.llamarpc.com'],
  [84532, 'https://base-sepolia-rpc.publicnode.com'],
  [19011, 'https://rpc.mainnet.oasys.homeverse.games'],
  [40875, 'https://rpc.testnet.oasys.homeverse.games'],
  [660279, 'https://xai-chain.net/rpc'],
  [37714555429, 'https://testnet-v2.xai-chain.net/rpc'],
  [3776, 'https://rpc.startale.com/astar-zkevm'],
  [6038361, 'https://rpc.startale.com/zkyoto'],
  [2730, 'https://xr-sepolia-testnet.rpc.caldera.xyz/http'],
  [40, 'https://mainnet-asia.telos.net/evm']
])

// These are either old testnets or local hardhat networks
export const IGNORED_CHAIN_IDS = new Set([3, 4, 5, 42, 69, 420, 80001, 84531, 421613, 31337, 31338])
