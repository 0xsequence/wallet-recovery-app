import { ContractInfo } from '@0xsequence/indexer'
import { ChainId, networks } from '@0xsequence/network'
import { ethers } from 'ethers'

export const getNetworkTitle = (chainId: number) => {
  const network = networks[chainId as ChainId]
  return network?.title ?? network?.name ?? 'Unknown'
}

interface NativeTokenInfo extends ContractInfo {
  type: 'NATIVE'
}

const ZERO_ADDRESS = ethers.ZeroAddress

const ETH: NativeTokenInfo = {
  chainId: ChainId.MAINNET,
  address: ZERO_ADDRESS,
  symbol: 'ETH',
  name: 'Ethereum',
  decimals: 18,
  logoURI: '', //nativeTokenImageUrl(ChainId.MAINNET),
  type: 'NATIVE',
  deployed: true,
  bytecodeHash: '',
  extensions: {
    description:
      'Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes token, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.',
    link: 'https://ethereum.org/',
    ogImage: '',
    originAddress: '',
    originChainId: 0,
    blacklist: false,
    verified: true,
    verifiedBy: 'Sequence',
    featured: false
  },
  updatedAt: '2023-11-20T20:00:00.000000000Z'
}

const sETH: NativeTokenInfo = {
  ...ETH,
  chainId: ChainId.SEPOLIA,
  symbol: 'sETH',
  name: 'Sepolia Ethereum'
}

const POL: NativeTokenInfo = {
  chainId: ChainId.POLYGON,
  address: ZERO_ADDRESS,
  symbol: 'POL',
  name: 'Polygon',
  decimals: 18,
  type: 'NATIVE',
  logoURI: '', //nativeTokenImageUrl(ChainId.POLYGON),
  deployed: true,
  bytecodeHash: '',
  extensions: {
    description: 'Polygon provides scalable, secure and instant Ethereum transactions.',
    link: 'https://polygon.technology/',
    ogImage: '',
    originAddress: '',
    originChainId: 0,
    blacklist: false,
    verified: true,
    verifiedBy: 'Sequence',
    featured: false
  },
  updatedAt: '2023-11-20T20:00:00.000000000Z'
}

const AVAX: NativeTokenInfo = {
  chainId: ChainId.AVALANCHE,
  address: ZERO_ADDRESS,
  symbol: 'AVAX',
  name: 'AVAX',
  decimals: 18,
  type: 'NATIVE',
  logoURI: '', //nativeTokenImageUrl(ChainId.AVALANCHE),
  deployed: true,
  bytecodeHash: '',
  extensions: {
    description:
      'Avalanche is a high throughput smart contract blockchain platform. Validators secure the network through a proof-of-stake consensus protocol. It is said to be fast, low cost, and environmental friendly.',
    link: 'https://avax.network',
    ogImage: '',
    originAddress: '',
    originChainId: 0,
    blacklist: false,
    verified: true,
    verifiedBy: 'Sequence',
    featured: false
  },
  updatedAt: '2023-11-20T20:00:00.000000000Z'
}

const XDAI: NativeTokenInfo = {
  chainId: ChainId.GNOSIS,
  address: ZERO_ADDRESS,
  symbol: 'XDAI',
  name: 'XDAI',
  decimals: 18,
  type: 'NATIVE',
  logoURI: '', //nativeTokenImageUrl(ChainId.GNOSIS),
  deployed: true,
  bytecodeHash: '',
  extensions: {
    description:
      'xDai is the native stable token of the Gnosis chain blockchain. Each xDai token is worth ~ 1 US dollar.',
    link: 'https://gnosischain.com',
    ogImage: '',
    originAddress: '',
    originChainId: 0,
    blacklist: false,
    verified: true,
    verifiedBy: 'Sequence',
    featured: false
  },
  updatedAt: '2023-11-20T20:00:00.000000000Z'
}

const aPol: NativeTokenInfo = {
  ...POL,
  chainId: ChainId.POLYGON_AMOY,
  symbol: 'aPOL',
  name: 'Amoy Polygon'
}

const BNB: NativeTokenInfo = {
  chainId: ChainId.BSC,
  address: ZERO_ADDRESS,
  name: 'BNB',
  type: 'NATIVE',
  symbol: 'BNB',
  decimals: 18,
  logoURI: '', //nativeTokenImageUrl(ChainId.BSC),
  deployed: true,
  bytecodeHash: '',
  extensions: {
    link: 'https://www.binance.com/',
    description:
      'BNB is the native asset on Binance Chain, a blockchain software system developed by Binance and the community. BNB has multiple forms of utility and powers the Binance Ecosystem as its underlying gas.',
    ogImage: '',
    originChainId: 0,
    originAddress: '',
    blacklist: false,
    verified: true,
    verifiedBy: 'Sequence',
    featured: false
  },
  updatedAt: '2023-11-20T20:00:00.000000000Z'
}

const tBNB: NativeTokenInfo = {
  ...BNB,
  chainId: ChainId.BSC_TESTNET,
  symbol: 'BNB',
  name: 'Testnet BNB'
}

const XAI: NativeTokenInfo = {
  chainId: ChainId.XAI,
  address: ZERO_ADDRESS,
  symbol: 'XAI',
  name: 'XAI',
  type: 'NATIVE',
  decimals: 18,
  logoURI: '', //networkImageUrl(ChainId.XAI),
  deployed: true,
  bytecodeHash: '',
  extensions: {
    link: 'https://xai.games/',
    description: 'XAI is the native asset on the XAI chain',
    ogImage: '',
    originChainId: 0,
    originAddress: '',
    blacklist: false,
    verified: true,
    verifiedBy: 'Sequence',
    featured: false
  },
  updatedAt: '2024-02-28T20:00:00.000000000Z'
}

const tXAI: NativeTokenInfo = {
  ...XAI,
  chainId: ChainId.XAI_SEPOLIA,
  logoURI: '', //networkImageUrl(ChainId.XAI_SEPOLIA),
  symbol: 'sXAI',
  name: 'Sepolia XAI'
}

const HomeverseOAS: NativeTokenInfo = {
  chainId: ChainId.HOMEVERSE,
  address: ZERO_ADDRESS,
  symbol: 'OAS',
  name: 'OAS',
  type: 'NATIVE',
  decimals: 18,
  logoURI: '', //nativeTokenImageUrl(ChainId.HOMEVERSE),
  deployed: true,
  bytecodeHash: '',
  extensions: {
    link: 'https://www.oasys.games/',
    description:
      'OAS is the native asset on the OASYS chain, its also the native asset on the HomeVerse chain',
    ogImage: '',
    originChainId: 9372,
    originAddress: ZERO_ADDRESS,
    blacklist: false,
    verified: true,
    verifiedBy: 'Sequence',
    featured: false
  },
  updatedAt: '2023-11-20T20:00:00.000000000Z'
}

const tHomeVerseOAS: NativeTokenInfo = {
  ...HomeverseOAS,
  chainId: ChainId.HOMEVERSE_TESTNET,
  name: 'Testnet OAS'
}

const tXR: NativeTokenInfo = {
  chainId: ChainId.XR_SEPOLIA,
  address: ZERO_ADDRESS,
  symbol: 'tXR',
  name: 'Sepolia XR',
  type: 'NATIVE',
  decimals: 18,
  logoURI: '', //networkImageUrl(ChainId.XR_SEPOLIA),
  deployed: true,
  bytecodeHash: '',
  extensions: {
    link: 'https://xr-one.gitbook.io/xr',
    description: 'tXR is the native asset on the XR sepolia chain',
    ogImage: '',
    originChainId: 0,
    originAddress: '',
    blacklist: false,
    verified: true,
    verifiedBy: 'Sequence',
    featured: false
  },
  updatedAt: '2024-04-09T11:46:00.000000000Z'
}

// List of native currencies for each networks
const nativeTokenInfo = {
  [ChainId.MAINNET]: ETH, // Mainnet
  [ChainId.SEPOLIA]: sETH, // Sepolia
  [ChainId.POLYGON]: POL, // Pol
  [ChainId.POLYGON_AMOY]: aPol, // Amoy
  [ChainId.POLYGON_ZKEVM]: { ...ETH, chainId: ChainId.POLYGON_ZKEVM }, // Polygon zkEVM
  [ChainId.BSC]: BNB, // BSC
  [ChainId.BSC_TESTNET]: tBNB, // BNB Testnet
  [ChainId.AVALANCHE]: AVAX, // Avalanche
  [ChainId.GNOSIS]: XDAI,
  [ChainId.ARBITRUM]: { ...ETH, chainId: ChainId.ARBITRUM },
  [ChainId.ARBITRUM_NOVA]: { ...ETH, chainId: ChainId.ARBITRUM_NOVA },
  [ChainId.ARBITRUM_SEPOLIA]: { ...ETH, chainId: ChainId.ARBITRUM_SEPOLIA },
  [ChainId.OPTIMISM]: { ...ETH, chainId: ChainId.OPTIMISM },
  [ChainId.OPTIMISM_SEPOLIA]: { ...ETH, chainId: ChainId.OPTIMISM_SEPOLIA },
  [ChainId.BASE]: { ...ETH, chainId: ChainId.BASE },
  [ChainId.BASE_SEPOLIA]: { ...ETH, chainId: ChainId.BASE_SEPOLIA },
  [ChainId.XAI]: XAI,
  [ChainId.XAI_SEPOLIA]: tXAI,
  [ChainId.HOMEVERSE]: HomeverseOAS,
  [ChainId.HOMEVERSE_TESTNET]: tHomeVerseOAS,
  [ChainId.XR_SEPOLIA]: tXR
}

export const getNativeTokenInfo = (chainId: keyof typeof nativeTokenInfo) => {
  return nativeTokenInfo[chainId] || null
}
