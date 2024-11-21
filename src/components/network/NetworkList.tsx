import { Box } from '@0xsequence/design-system'
import { NetworkConfig } from '@0xsequence/network'

import NetworkItem from './NetworkItem'

export default function NetworkList({ networks }: { networks: NetworkConfig[] }) {
  return (
    <Box flexDirection="column" gap="3" paddingY="6">
      {networks.map((network, i) => (
        <NetworkItem key={i} network={network} />
      ))}
    </Box>
  )
}
