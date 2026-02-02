import { NetworkImage, Text } from '@0xsequence/design-system'

import { getNetworkTitle } from '~/utils/network'

export default function NetworkTag({
  chainId,
  renderImage
}: {
  chainId: number
  renderImage?: boolean
}) {
  return (
    <div
      className='bg-background-overlay w-fit h-fit rounded-sm px-2 py-1 flex flex-row items-center gap-1'
    >
      {renderImage && <NetworkImage chainId={chainId} style={{ width: '16px', height: '16px' }} />}

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
    </div>
  )
}
