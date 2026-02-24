import { Address } from 'viem'
import { TokenBalance, TokenMetadata } from '@0xsequence/indexer'
import { Network } from '@0xsequence/wallet-primitives'


export type ValueWithFormatted = {
  value: string
  formatted: string
}

type TokenGroupProps = {
  keys: string[]
  isGroup: boolean
  crosschainId?: {
    id: string | undefined
    title: string | undefined
    icon: string | undefined
  }
  group?: {
    id: string
    items: TokenRecord[]
    balance: ValueWithFormatted
    balances: { balance: string; decimals: number }[]
    wallets: string[]
    chains: number[]
    icon?: string
  }
  fiat:
    | {
        value: number
        currency: string
        formatted: string
        change: { value: number; formatted: string; isUp: boolean }
      }
    | false
}

export const TOKEN_TYPES = {
  COIN: 'COIN',
  COLLECTIBLE: 'COLLECTIBLE',
  GROUP: 'GROUP',
} as const

type TokenType = (typeof TOKEN_TYPES)[keyof typeof TOKEN_TYPES]

type CommonTokenRecord = TokenGroupProps & {
  readOnly?: boolean
  type: TokenType
  contractAddress: Address
  contractType: TokenBalance['contractType']
  contractInfo?: TokenBalance['contractInfo']
  accountAddress: Address
  chainId: number
  network?: Network.Network
  name: string
  testnet: boolean
  balance: string
  holdings: ValueWithFormatted
  uuid: string
  path: string
  symbol: string
  logoURI?: string
  decimals: number

  explorerUrl?: string
  isSwappable?: boolean
  isEmpty: boolean
  isUnknown: boolean
  isVerified: boolean
}

export type CollectibleAssetType = 'image' | 'video' | 'audio' | 'iframe'

export type CollectibleAsset = {
  type: CollectibleAssetType
  url: string
}


interface CollectibleTokenRecord extends CommonTokenRecord {
  type: 'COLLECTIBLE'
  tokenId: string
  tokenMetadata?: TokenMetadata
  image?: string
  asset?: CollectibleAsset
  description?: string
}

interface CoinTokenRecord extends CommonTokenRecord {
  type: 'COIN'
}

export type TokenRecord = CoinTokenRecord | CollectibleTokenRecord