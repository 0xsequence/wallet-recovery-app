import { Box, Card, CloseIcon, Image, Text, tokenImageUrl } from '@0xsequence/design-system'
import { TokenBalance } from '@0xsequence/indexer'
import { ethers } from 'ethers'

import { truncateNumber } from '~/utils/bignumber'

import { ButtonWithIcon } from '~/components/misc/ButtonWithIcon'
import { ExternalIcon } from '~/components/misc/ExternalIcon'
import NetworkTag from '~/components/network/NetworkTag'

import SendIcon from '~/assets/icons/send.svg'

export default function TokenBalanceItem({
  disabled,
  tokenBalance,
  onSendClick,
  onRemoveClick
}: {
  disabled?: boolean
  tokenBalance: TokenBalance
  onSendClick: () => void
  onRemoveClick?: () => void
}) {
  const formattedBalance = ethers.formatUnits(tokenBalance.balance, tokenBalance.contractInfo?.decimals ?? 18)
  const truncatedBalance = truncateNumber(Number(formattedBalance), 5)

  return (
    <Card flexDirection="row" alignItems="center" gap="3">
      <ExternalIcon
        background="text80"
        src={tokenImageUrl(tokenBalance?.chainId!, tokenBalance?.contractAddress!)}
      />

      <Box flexDirection="column">
        <Box gap="1" alignItems="center">
          <Text variant="normal" fontWeight="bold" color="text80">
            {tokenBalance.contractInfo?.symbol ?? 'Native'}
          </Text>

          <NetworkTag chainId={tokenBalance.chainId} />
        </Box>

        <Box>
          <Text variant="normal" fontWeight="medium" color="text50">
            {truncatedBalance}
          </Text>
        </Box>
      </Box>

      <Box flexDirection="row" alignItems="center" marginLeft="auto" gap="3">
        <ButtonWithIcon icon={<Image src={SendIcon} />} disabled={disabled} onClick={onSendClick} />

        {onRemoveClick && (
          <ButtonWithIcon icon={<CloseIcon color="text100" />} onClick={() => onRemoveClick?.()} />
        )}
      </Box>
    </Card>
  )
}
