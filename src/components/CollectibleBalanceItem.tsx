import { Box, Button, Card, Image, Text } from '@0xsequence/design-system'
import { BigNumberish, ethers } from 'ethers'

import { CollectibleInfo } from '~/stores/CollectibleStore'

import NetworkTag from './network/NetworkTag'

export default function CollectibleBalanceItem({
  collectibleInfo,
  onSendClick,
  onRemoveClick
}: {
  collectibleInfo: CollectibleInfo
  onSendClick: () => void
  onRemoveClick?: () => void
}) {
  return (
    <Card width="full" flexDirection="column" gap="2" padding="4">
      <Box flexDirection="row" alignItems="center" gap="2">
        <Text variant="medium" color="text80" wordBreak="break-word">
          {collectibleInfo.collectibleInfoResponse.name ?? 'Collectible'}
        </Text>
      </Box>
      {collectibleInfo.collectibleInfoResponse.image && (
        <Box style={{ height: '200px' }}>
          <Image
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
            src={collectibleInfo.collectibleInfoResponse.image}
            width="full"
          />
        </Box>
      )}

      <Box justifyContent="flex-end">
        <Text variant="medium" color="text100">
          {collectibleInfo.collectibleInfoParams.contractType === 'ERC1155'
            ? Number(
                ethers.formatUnits(
                  collectibleInfo.collectibleInfoResponse.balance as BigNumberish,
                  collectibleInfo.collectibleInfoResponse.decimals ?? 0
                )
              )
            : 1}
        </Text>
      </Box>

      <Box flexDirection="row" justifyContent="space-between">
        <NetworkTag chainId={collectibleInfo.collectibleInfoParams.chainId} />
        <Box>
          <Button size="xs" label="Send" variant="primary" shape="square" onClick={onSendClick} />
          {onRemoveClick && (
            <Button marginLeft="2" size="xs" label="Remove" shape="square" onClick={onRemoveClick} />
          )}
        </Box>
      </Box>
    </Card>
  )
}
