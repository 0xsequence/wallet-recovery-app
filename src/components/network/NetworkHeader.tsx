import { Box, Divider, TabsPrimitive, Text } from '@0xsequence/design-system'
import { NetworkType } from '@0xsequence/network'

import NetworkTab from './NetworkTab'

export default function NetworkHeader({
  selectedNetworkType
}: {
  selectedNetworkType: NetworkType | 'arweave'
}) {
  return (
    <Box flexDirection="column" width="full" position="absolute" background="backgroundPrimary">
      <Box paddingTop="6" paddingX="6">
        <Text variant="large" fontWeight="bold" color="text80">
          Networks
        </Text>
        <TabsPrimitive.TabsList style={{ marginTop: '24px' }}>
          <Box flexDirection="row" style={{ height: '32px' }}>
            <NetworkTab value={NetworkType.MAINNET} selectedNetworkType={selectedNetworkType} />

            <NetworkTab value={NetworkType.TESTNET} selectedNetworkType={selectedNetworkType} />

            <NetworkTab value="arweave" selectedNetworkType={selectedNetworkType} />
          </Box>
        </TabsPrimitive.TabsList>
      </Box>
      <Divider marginY="0" />
    </Box>
  )
}
