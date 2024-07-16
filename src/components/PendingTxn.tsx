import { Box, Text } from '@0xsequence/design-system'
import { TokenBalance } from '@0xsequence/indexer'

export default function PendingTxn({
  tokenBalance,
  amount,
  to
}: {
  tokenBalance: TokenBalance
  amount: string
  to: string
}) {
  return (
    <Box
      background="backgroundMuted"
      width="fit"
      height="fit"
      borderRadius="sm"
      paddingTop="1"
      paddingBottom="2"
      paddingX="2"
    >
      <Text variant="xsmall" color="text100">
        Sending {tokenBalance?.contractInfo?.symbol} on {tokenBalance?.chainId}
      </Text>
      <Text variant="small" color="text50">
        {amount} {tokenBalance?.contractInfo?.symbol}
      </Text>
      <Text variant="small" color="text50">
        To address {to}
      </Text>
    </Box>
  )
}
