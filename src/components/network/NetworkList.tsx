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

{
  /* <Box width="full" flexDirection="column" alignItems="flex-end" marginY="4">
      {!isAddNetworkActive ? (
        <Button
          label="Add network"
          variant="primary"
          size="md"
          shape="square"
          onClick={() => {
            setIsAddNetworkActive(true)
          }}
        />
      ) : (
        <AddNetwork onClose={() => setIsAddNetworkActive(false)} />
      )}
    </Box> */
}
