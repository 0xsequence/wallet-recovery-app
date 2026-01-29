import { TokenBalance, TokenMetadata } from "@0xsequence/indexer"
import { CollectibleAsset, CollectibleAssetType, TOKEN_TYPES, TokenRecord, ValueWithFormatted } from "./types"
import { Address } from "viem"
import { Network } from "@0xsequence/wallet-primitives"
import { formatPrettyBalance } from "./format-pretty-balance"
import { imgproxy } from "./image-proxy"

const CONTRACT_TYPES = {
  NATIVE: 'NATIVE',
  ERC20: 'ERC20',
  ERC1155: 'ERC1155',
  ERC721: 'ERC721',
} as const

/**
 * Creates a token record from a token balance.
 *
 * @param token - The token balance to create a record from.
 * @returns A token record.
 */
export function createTokenRecord(token: TokenBalance): TokenRecord {
  const contractType = token.contractType
  const contractAddress = token.contractAddress as Address
  const accountAddress = token.accountAddress as Address
  const { chainId } = token
  const network = Network.getNetworkFromChainId(chainId)
  const testnet = network?.type === Network.NetworkType.TESTNET

  const isEmpty = token.balance === '0'
  const isUnknown =
    contractType === 'UNKNOWN' ||
    (!token.contractInfo?.symbol && !token.contractInfo?.name)
  const isVerified = token.contractInfo?.extensions.verified === true

  //const group = getGroupInfo(contractAddress)

  const common: Omit<
    TokenRecord,
    | 'type'
    | 'symbol'
    | 'name'
    | 'decimals'
    | 'holdings'
    | 'logoURI'
    | 'explorerUrl'
  > = {
    ...token,
    contractAddress,
    accountAddress,
    uuid: getUuid(token),
    path: getPath(token),
    contractType,
    network,
    testnet,
    isEmpty,
    isUnknown,
    isVerified,
    isGroup: false,
    isSwappable: false,
    fiat: false,
    keys: [],
  }

  switch (contractType) {
    case CONTRACT_TYPES.NATIVE: {
      const decimals = network?.nativeCurrency.decimals ?? 18

      return {
        ...common,
        type: TOKEN_TYPES.COIN,
        name: network?.nativeCurrency.name || 'Native Token',
        symbol: network?.nativeCurrency.symbol || '???',
        decimals,
        holdings: getHoldings(token.balance, decimals),
        logoURI: network?.logoUrl,
        fiat: false,

        explorerUrl: getExplorerUrl(chainId, contractAddress),
      }
    }

    case CONTRACT_TYPES.ERC20: {
      const decimals = token.contractInfo?.decimals ?? 18

      return {
        ...common,
        type: TOKEN_TYPES.COIN,
        name: token.contractInfo?.name || 'Unknown',
        symbol: token.contractInfo?.symbol || '???',
        decimals,
        holdings: getHoldings(token.balance, decimals),
        logoURI: token.contractInfo?.logoURI,
        fiat: false,
        explorerUrl: getExplorerUrl(chainId, contractAddress),
      }
    }

    case CONTRACT_TYPES.ERC1155:
    case CONTRACT_TYPES.ERC721: {
      const decimals =
        token.tokenMetadata?.decimals ?? token.contractInfo?.decimals ?? 0

      const image =
        imgproxy(token.tokenMetadata?.image) || token.tokenMetadata?.image_data

      // if (token.contractType === 'ERC1155' || token.contractType === 'ERC721') {
      //   console.log(index, token.contractAddress, token.tokenMetadata)
      // }

      return {
        ...common,
        type: TOKEN_TYPES.COLLECTIBLE,
        name: token.tokenMetadata?.name || 'Unknown',
        description: token.tokenMetadata?.description,
        tokenId: token.tokenID!,
        tokenMetadata: token.tokenMetadata!,
        symbol: token.contractInfo?.symbol || '???',
        image,
        asset: getCollectibleAsset(token.tokenMetadata, image),
        decimals,
        holdings: getHoldings(token.balance, decimals), //{ value: token.balance, formatted: token.balance }, // getHoldings(token.balance, decimals),
        explorerUrl: getExplorerUrl(chainId, contractAddress, token.tokenID),
      }
    }

    default: {
      const decimals =
        token.tokenMetadata?.decimals ??
        token.contractInfo?.decimals ??
        network?.nativeCurrency.decimals ??
        18

      return {
        ...common,
        type: TOKEN_TYPES.COIN,
        name: token.contractInfo?.name || 'Unknown',
        symbol: token.contractInfo?.symbol || '???',
        decimals,
        holdings: getHoldings(token.balance, decimals),
        logoURI: token.contractInfo?.logoURI,
        fiat: false,
        explorerUrl: getExplorerUrl(chainId, contractAddress),
      }
    }
  }
}

function getUuid(token: TokenBalance): string {
  const contract = token.contractAddress.toLowerCase()
  const tokenId = token.tokenID || 0
  return `${token.accountAddress}::${token.chainId}::${contract}::${tokenId}`
}

function getPath(token: TokenBalance): string {
  const contract = token.contractAddress.toLowerCase()
  const tokenId = token.tokenID || 0
  const address = token.accountAddress.slice(-4)

  if (token.contractType === CONTRACT_TYPES.NATIVE) {
    return `/tokens/${address}/${token.chainId}/native`
  } else if (token.contractType === CONTRACT_TYPES.ERC20 || tokenId === 0) {
    return `/tokens/${address}/${token.chainId}/${contract}`
  }

  return `/tokens/${address}/${token.chainId}/${contract}/${tokenId}`
}

const getHoldings = (value: string, decimals: number): ValueWithFormatted => {
  return {
    value,
    formatted: !decimals ? value : formatPrettyBalance(value, decimals),
  }
}

const getCollectibleAsset = (
  tokenMetadata: TokenMetadata | undefined,
  fallbackImage?: string
): CollectibleAsset | undefined => {
  if (!tokenMetadata) {
    return undefined
  }

  const animationUrl = tokenMetadata.animation_url
  const animationUrlExt = animationUrl?.split('.').pop()?.toLowerCase()

  let asset: CollectibleAsset | undefined

  if (animationUrl && animationUrlExt !== 'gltf' && animationUrlExt !== 'glb') {
    let assetType: CollectibleAssetType | undefined

    if (['mp4', 'm4v', 'ogg', 'ogv', 'webm'].includes(animationUrlExt!)) {
      assetType = 'video'
    } else if (['mp3', 'wav', 'oga'].includes(animationUrlExt!)) {
      assetType = 'audio'
      // } else if (['gltf', 'glb'].includes(animationUrlExt!)) {
      //   assetType = 'gltf'
    } else {
      assetType = 'iframe'
    }

    asset = {
      type: assetType,
      url: animationUrl,
    }
  } else if (tokenMetadata.video) {
    asset = {
      type: 'video',
      url: tokenMetadata.video,
    }
  } else if (tokenMetadata.audio) {
    asset = {
      type: 'audio',
      url: tokenMetadata.audio,
    }
  } else if (fallbackImage) {
    asset = {
      type: 'image',
      url: fallbackImage,
    }
  } else {
    asset = undefined
  }

  return asset
}


function getExplorerUrl(
  chainId: number,
  contractAddress: Address,
  tokenId?: string | number
) {
  const blockExplorer = Network.getNetworkFromChainId(chainId)?.blockExplorer

  if (!blockExplorer) {
    return undefined
  }

  return tokenId
    ? `${blockExplorer.url}token/${contractAddress}?a=${tokenId}`
    : `${blockExplorer.url}address/${contractAddress}`
}
