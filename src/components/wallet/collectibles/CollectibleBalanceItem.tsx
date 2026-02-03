import { Card, CloseIcon, IconButton, SendIcon, Text } from '@0xsequence/design-system'
import { BigNumberish, ethers } from 'ethers'

import { CollectibleInfo } from '~/stores/CollectibleStore'

import { ExternalIcon } from '~/components/misc/ExternalIcon'
import NetworkTag from '~/components/network/NetworkTag'


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
    <Card className='flex flex-row items-center gap-3'>
      {collectibleInfo.collectibleInfoResponse.image && (
        <div>
          <ExternalIcon src={collectibleInfo.collectibleInfoResponse.image} />
        </div>
      )}

      <div className='flex flex-col justify-center'>
        <div className='flex flex-row items-center gap-2'>
          <Text variant="normal" fontWeight="bold" color="text80">
            {collectibleInfo.collectibleInfoResponse.name ?? 'Collectible'}
          </Text>
          <Text variant="small" fontWeight="bold" color="text50" className='text-xs'>
            #{collectibleInfo.collectibleInfoParams.tokenId}
          </Text>
          <NetworkTag chainId={collectibleInfo.collectibleInfoParams.chainId} />
        </div>

        <Text variant="small" fontWeight="medium" color="text50" className='text-xs'>
          {collectibleInfo.collectibleInfoParams.contractType === 'ERC1155'
            ? Number(
              ethers.formatUnits(
                collectibleInfo.collectibleInfoResponse.balance as BigNumberish,
                collectibleInfo.collectibleInfoResponse.decimals ?? 0
              )
            )
            : 1}
        </Text>
      </div>

      <div className='flex flex-row items-center gap-3 ml-auto'>
        <IconButton shape="square" icon={SendIcon} size="sm" disabled={false} onClick={onSendClick} />

        {onRemoveClick && (
          <IconButton shape="square" icon={CloseIcon} size="sm" onClick={() => onRemoveClick?.()} />
        )}
      </div>
    </Card>
  )
}
