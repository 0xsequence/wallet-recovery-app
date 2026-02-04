import { Card, IconButton, SendIcon, Text, tokenImageUrl } from '@0xsequence/design-system'
import { TokenBalance } from '@0xsequence/indexer'
import { ethers } from 'ethers'

import { truncateNumber } from '~/utils/bignumber'

import { ExternalIcon } from '~/components/misc/ExternalIcon'
import NetworkTag from '~/components/network/NetworkTag'

export default function TokenBalanceItem({
  disabled,
  tokenBalance,
  onSendClick,
}: {
  disabled?: boolean
  tokenBalance: TokenBalance
  onSendClick: () => void
}) {
  const formattedBalance = ethers.formatUnits(tokenBalance.balance, tokenBalance.contractInfo?.decimals ?? 18)
  const truncatedBalance = truncateNumber(Number(formattedBalance), 5)

  return (
    <Card className='flex flex-row items-center gap-3'>
      <ExternalIcon
        src={tokenImageUrl(tokenBalance.chainId, tokenBalance.contractAddress)}
      />

      <div className='flex flex-col'>
        <div className='flex flex-row items-center gap-2'>
          <Text variant="normal" fontWeight="bold" color="text80">
            {tokenBalance.contractInfo?.symbol ?? 'Native'}
          </Text>

          <NetworkTag chainId={tokenBalance.chainId} />
        </div>

        <Text variant="normal" fontWeight="medium" color="text50" className='text-xs'>
          {truncatedBalance} {tokenBalance.contractInfo?.symbol ?? 'Native'}
        </Text>
      </div>

      <div className='flex flex-row items-center ml-auto gap-3'>
        <IconButton shape="square" icon={SendIcon} size="sm" disabled={disabled} onClick={onSendClick} />
      </div>
    </Card>
  )
}
