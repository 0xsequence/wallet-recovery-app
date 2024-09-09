import { Box, Button, Card, Image, Text } from '@0xsequence/design-system'

import { CollectibleInfo } from '~/stores/CollectibleStore'

import NetworkTag from './NetworkTag'

export default function CollectibleBalanceItem({
  collectibleInfo,
  onSendClick
}: {
  collectibleInfo: CollectibleInfo
  onSendClick: () => void
}) {
  return (
    <Card width="full" flexDirection="column" gap="2" padding="4">
      <Box flexDirection="row" alignItems="center" gap="2">
        <Text variant="medium" color="text80">
          {collectibleInfo.collectibleInfoResponse.name ?? 'Collectible'}
        </Text>
      </Box>
      <Box style={{ height: '200px' }}>
        <Image
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }}
          src={collectibleInfo.collectibleInfoResponse.image ?? ''}
          width="full"
        />
      </Box>
      <Box flexDirection="row" style={{ justifyContent: 'space-between' }}>
        <NetworkTag chainId={collectibleInfo.collectibleInfoParams.chainId} />
        <Button size="xs" label="Send" variant="primary" shape="square" onClick={onSendClick} />
      </Box>
    </Card>
  )
}
