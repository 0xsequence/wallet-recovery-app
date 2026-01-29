import { Box, Text } from "@0xsequence/design-system"
import { ParsedCall } from "~/utils/transaction-parser"
import { formatPrettyBalance } from "~/utils/format-pretty-balance"

interface InsufficientBalanceMessageProps {
  firstCall: ParsedCall
  transactionAmount?: bigint
  balances: any[]
  collectibles: any[]
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
  const getMessage = () => {
    if (firstCall.type === 'erc721') {
      return `Insufficient balance. You don't own this NFT (Token ID: ${firstCall.tokenId?.toString()})`
    }

    if (firstCall.type === 'erc1155') {
      const collectible = collectibles.find(
        c => c.collectibleInfoParams.address.toLowerCase() === firstCall.contractAddress?.toLowerCase() &&
          c.collectibleInfoParams.tokenId === Number(firstCall.tokenId) &&
          c.collectibleInfoParams.chainId === chainId
      )
      const userBalance = collectible?.collectibleInfoResponse.balance?.toString() ?? '0'
      return `Insufficient balance. You have ${userBalance} but need ${transactionAmount?.toString() ?? '0'} of Token ID: ${firstCall.tokenId?.toString()}.`
    }

    // For ERC20 and native tokens
    const balanceOfToken = balances.find(balance => balance.contractAddress === firstCall.contractAddress)
    const metadata = tokenMetadata.get(firstCall.contractAddress!)
    const decimals = metadata?.decimals ?? 18
    const symbol = metadata?.symbol ?? 'tokens'

    return `Insufficient balance. You have ${formatPrettyBalance(balanceOfToken?.balance ?? '0', decimals)} ${symbol} but need ${formatPrettyBalance(transactionAmount?.toString() ?? '0', decimals)} ${symbol}.`
  }

  return (
    <Box flexDirection="column" gap="1">
      <Text variant="small" fontWeight="medium" color="negative">
        {getMessage()}
      </Text>
    </Box>
  )
}
