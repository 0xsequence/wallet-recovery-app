import { Box, Spinner, Text } from '@0xsequence/design-system'

import NetworkTag from './NetworkTag'

export default function PendingTxn({
  symbol,
  chainId,
  to,
  amount
}: {
  symbol: string
  chainId: number
  to: string
  amount?: string
}) {
  return (
    <Box flexDirection="column" width="full" gap="4">
      <Text variant="large" color="text80">
        Pending transaction
      </Text>

      <Box
        background="backgroundMuted"
        flexDirection="row"
        width="full"
        height="fit"
        borderRadius="sm"
        paddingX="4"
        paddingY="2"
        alignItems="center"
        gap="5"
      >
        <Spinner size="md" />

        <Box flexDirection="column" gap="1">
          <Box flexDirection="row" alignItems="center" gap="1">
            <Text variant="small" color="text100">
              Sending {amount} {symbol} on
            </Text>
            <NetworkTag chainId={chainId} paddingTop="0" paddingBottom="1" />

            <Text variant="small" color="text80">
              to {to}
            </Text>
          </Box>
          <Text variant="small" color="text50">
            Your external wallet will prompt you to confirm the transaction
          </Text>
        </Box>
      </Box>
    </Box>
  )
}
