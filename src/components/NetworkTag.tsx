import { Box, Text } from '@0xsequence/design-system'

import { getNetworkTitle } from '~/utils/network'

export default function NetworkTag({ chainId }: { chainId: number }) {
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
        {getNetworkTitle(chainId)}
      </Text>
    </Box>
  )
}
