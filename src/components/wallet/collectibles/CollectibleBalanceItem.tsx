import { Box, Card, CloseIcon, Image, Text } from '@0xsequence/design-system'
import { BigNumberish, ethers } from 'ethers'

import { CollectibleInfo } from '~/stores/CollectibleStore'

import { ButtonWithIcon } from '~/components/helpers/ButtonWithIcon'
import { ExternalIcon } from '~/components/helpers/ExternalIcon'
import NetworkTag from '~/components/network/NetworkTag'

import SendIcon from '~/assets/icons/send.svg'

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
    <Card flexDirection="row" alignItems="center" gap="3">
      {collectibleInfo.collectibleInfoResponse.image && (
        <Box>
          <ExternalIcon background="buttonGlass" src={collectibleInfo.collectibleInfoResponse.image} />
        </Box>
      )}

      <Box flexDirection="column">
        <Box gap="2" alignItems="center">
          <Text variant="normal" fontWeight="bold" color="text80">
            {collectibleInfo.collectibleInfoResponse.name ?? 'Collectible'}
          </Text>
          <Text variant="small" fontWeight="bold" color="text50">
            #{collectibleInfo.collectibleInfoParams.tokenId}
          </Text>
          <NetworkTag chainId={collectibleInfo.collectibleInfoParams.chainId} />
        </Box>

        <Box>
          <Text variant="normal" fontWeight="bold" color="text50">
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
      </Box>

      <Box marginLeft="auto" gap="3">
        <ButtonWithIcon icon={<Image src={SendIcon} />} disabled={false} onClick={onSendClick} />

        {onRemoveClick && (
          <ButtonWithIcon icon={<CloseIcon color="text100" />} onClick={() => onRemoveClick?.()} />
        )}
      </Box>
    </Card>
  )
}
