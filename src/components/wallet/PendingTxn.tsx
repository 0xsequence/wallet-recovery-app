import { Box, Spinner, Text, truncateAddress, useMediaQuery } from '@0xsequence/design-system'

import NetworkTag from '~/components/network/NetworkTag'

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
  const isMobile = useMediaQuery('isMobile')

  return (
    <Box flexDirection="column" width="full" gap="5" paddingTop="7">
      <Text variant="normal" fontWeight="bold" color="text80">
        Pending transactions
      </Text>
      <Box background="backgroundSecondary" borderRadius="sm" alignItems="center" padding="4" gap="5">
        <Spinner size="md" width="full" />

        <Box flexDirection="column" gap="1" width="fit">
          <Box flexDirection={isMobile ? 'column' : 'row'} gap="1">
            <Box alignItems="center" gap="1">
              <Text variant="normal" fontWeight="medium" color="text80">
                Sending {Number(amount).toFixed(4)} {symbol} on
              </Text>
              <NetworkTag chainId={chainId} paddingTop="0" paddingBottom="1" />
            </Box>
            <Box alignItems="center" gap="1">
              <Text variant="normal" fontWeight="medium" color="text80">
                to
              </Text>
              <Text variant="normal" fontWeight="medium" color="text80" style={{ fontFamily: 'monospace' }}>
                {truncateAddress(to)}
              </Text>
            </Box>
          </Box>

          <Text variant="normal" fontWeight="medium" color="text50" width="fit">
            Your external wallet will prompt you to confirm the transaction
          </Text>
        </Box>
      </Box>
    </Box>
  )
}
