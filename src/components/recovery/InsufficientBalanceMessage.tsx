import { Alert } from "@0xsequence/design-system"
import type { TokenBalance } from "@0xsequence/indexer"
import { ethers } from "ethers"
import type { CollectibleInfo } from "~/stores/CollectibleStore"
import type { ParsedCall } from "~/utils/transaction-parser"
import { formatPrettyBalance } from "~/utils/format-pretty-balance"

interface InsufficientBalanceMessageProps {
  firstCall?: ParsedCall
  transactionAmount?: bigint
  balances: TokenBalance[]
  collectibles: CollectibleInfo[]
  chainId: number
  tokenMetadata: Map<string, { decimals: number; symbol: string }>
}

export function InsufficientBalanceMessage({
  firstCall,
  transactionAmount,
  balances,
  collectibles,
  chainId,
  tokenMetadata
}: InsufficientBalanceMessageProps) {
  if (!firstCall) {
    return null
  }

  const getMessage = () => {
    if (firstCall.type === 'erc721') {
      return `You don't own this NFT (Token ID: ${firstCall.tokenId?.toString()}).`
    }

    if (firstCall.type === 'erc1155') {
      const collectible = collectibles.find(
        c => c.collectibleInfoParams.address.toLowerCase() === firstCall.contractAddress?.toLowerCase() &&
          c.collectibleInfoParams.tokenId === Number(firstCall.tokenId) &&
          c.collectibleInfoParams.chainId === chainId
      )
      const userBalance = collectible?.collectibleInfoResponse.balance?.toString() ?? '0'
      return `You have ${userBalance} but need ${transactionAmount?.toString() ?? '0'} of Token ID: ${firstCall.tokenId?.toString()}.`
    }

    // For ERC20 and native tokens
    const contractAddress = firstCall.contractAddress || ethers.ZeroAddress
    const balanceOfToken = balances.find(
      balance => balance.contractAddress.toLowerCase() === contractAddress.toLowerCase() &&
        balance.chainId === chainId
    )
    const metadata = tokenMetadata.get(firstCall.contractAddress!)
    const decimals = metadata?.decimals ?? 18
    const symbol = metadata?.symbol ?? 'tokens'

    return `You have ${formatPrettyBalance(balanceOfToken?.balance ?? '0', decimals)} ${symbol} but need ${formatPrettyBalance(transactionAmount?.toString() ?? '0', decimals)} ${symbol}.`
  }

  return (
    <Alert.Helper
      variant="error"
      title="Insufficient balance"
      description={getMessage()}
      className='[&_[data-slot=alert-description]]:break-words'
    />
  )
}
