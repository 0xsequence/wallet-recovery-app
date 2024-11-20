import { Box, Button, Card, Text } from '@0xsequence/design-system'
import { TokenBalance } from '@0xsequence/indexer'
import { ethers } from 'ethers'

import { truncateNumber } from '~/utils/bignumber'

import NetworkTag from './network/NetworkTag'

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
    <Card width="full" flexDirection="column" gap="2">
      <Box flexDirection="row" alignItems="center">
        <Text variant="medium" color="text80">
          {tokenBalance.contractInfo?.symbol ?? 'Native Token'}
        </Text>
        <Box marginLeft="auto">
          <Text color="text80">{truncatedBalance}</Text>
        </Box>
      </Box>
      <Box flexDirection="row">
        <NetworkTag chainId={tokenBalance.chainId} />
        <Box marginLeft="auto" gap="2">
          <Button
            size="xs"
            label="Send"
            variant="primary"
            shape="square"
            disabled={disabled}
            onClick={onSendClick}
          />
          {onRemoveClick && <Button size="xs" label="Remove" shape="square" onClick={onRemoveClick} />}
        </Box>
      </Box>
    </Card>
  )
}
