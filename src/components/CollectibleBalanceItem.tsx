import { Box, Button, Card, Image, Text } from '@0xsequence/design-system'

import { CollectibleInfoParams, CollectibleInfoResponse } from '~/stores/CollectibleStore'

import NetworkTag from './NetworkTag'

export default function CollectibleBalanceItem({
  collectibleInfoParams,
  collectibleInfoResponse,
  onSendClick
}: {
  collectibleInfoParams: CollectibleInfoParams
  collectibleInfoResponse: CollectibleInfoResponse
  onSendClick: () => void
}) {
  return (
    <Card width="full" flexDirection="column" gap="2" padding="4">
      <Box flexDirection="row" alignItems="center" gap="2">
        <Text variant="medium" color="text80">
          {collectibleInfoResponse.name ?? 'Collectible'}
        </Text>
      </Box>
      <Box style={{ height: '200px' }}>
        <Image
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }}
          src={collectibleInfoResponse.image ?? ''}
          width="full"
        />
      </Box>
      <Box flexDirection="row">
        <NetworkTag chainId={collectibleInfoParams.chainId} />
      </Box>
    </Card>
  )
}
