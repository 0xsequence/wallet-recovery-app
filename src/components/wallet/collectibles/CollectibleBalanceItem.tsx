import { Card, CloseIcon, Text } from '@0xsequence/design-system'
import { BigNumberish, ethers } from 'ethers'

import { CollectibleInfo } from '~/stores/CollectibleStore'

import { ButtonWithIcon } from '~/components/misc/ButtonWithIcon'
import { ExternalIcon } from '~/components/misc/ExternalIcon'
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
          <Text variant="small" fontWeight="bold" color="text50">
            #{collectibleInfo.collectibleInfoParams.tokenId}
          </Text>
          <NetworkTag chainId={collectibleInfo.collectibleInfoParams.chainId} />
        </div>

        <div>
          <Text variant="normal" fontWeight="medium" color="text50">
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
      </div>

      <div className='flex flex-row items-center gap-3 ml-auto'>
        <ButtonWithIcon icon={<img src={SendIcon} alt="Send" className='w-4 h-4' />} disabled={false} onClick={onSendClick} />

        {onRemoveClick && (
          <ButtonWithIcon icon={<CloseIcon color="text100" />} onClick={() => onRemoveClick?.()} />
        )}
      </div>
    </Card>
  )
}
