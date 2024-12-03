import { Box, Text } from '@0xsequence/design-system'

import { getNetworkTitle } from '~/utils/network'

export default function NetworkTag({
  chainId,
  paddingTop = '0',
  paddingBottom = '1'
}: {
  chainId: number
  paddingTop?: '0' | '1' | '2'
  paddingBottom?: '0' | '1' | '2'
}) {
  return (
    <Box
      background="backgroundMuted"
      width="fit"
      height="fit"
      borderRadius="sm"
      paddingTop={paddingTop}
      paddingBottom={paddingBottom}
      paddingX="2"
    >
      <Text
        variant="xsmall"
        color="text80"
        style={{
          whiteSpace: 'nowrap',
          maxWidth: '100px',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {getNetworkTitle(chainId)}
      </Text>
    </Box>
  )
}
