import { Box, Button, Card, CloseIcon, Image, Text } from '@0xsequence/design-system'
import { TokenBalance } from '@0xsequence/indexer'
import { ethers } from 'ethers'

import { truncateNumber } from '~/utils/bignumber'

import { ButtonWithIcon } from '~/components/helpers/ButtonWithIcon'
import NetworkTag from '~/components/network/NetworkTag'

import EyeHiddenIcon from '~/assets/icons/eye-hidden.svg'
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
    <Card flexDirection="row" justifyContent="space-between" gap="3">
      {/* {tokenBalance.image && <Image src={tokenBalance.contractInfo.icon} />} */}
      <Box flexDirection="column">
        <Box gap="2" alignItems="center">
          <Text variant="large" fontWeight="bold" color="text100">
            {tokenBalance.contractInfo?.symbol ?? 'Native Token'}
          </Text>
          <NetworkTag chainId={tokenBalance.chainId} />
        </Box>

        <Box>
          <Text variant="normal" fontWeight="bold" color="text50">
            {truncatedBalance}
          </Text>
        </Box>
      </Box>

      <Box flexDirection="row" alignItems="center" gap="2">
        <ButtonWithIcon icon={<Image src={SendIcon} />} disabled={disabled} onClick={onSendClick} />

        <ButtonWithIcon icon={<Image src={EyeHiddenIcon} color="text100" height="5" />} onClick={() => {}} />

        {onRemoveClick && (
          <ButtonWithIcon icon={<CloseIcon color="text100" />} onClick={() => onRemoveClick?.()} />
        )}
      </Box>
    </Card>
  )
}
