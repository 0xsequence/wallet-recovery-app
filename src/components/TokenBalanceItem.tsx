import { Box, Text } from '@0xsequence/design-system'
import { TokenBalance } from '@0xsequence/indexer'
import { ethers } from 'ethers'

import { getNetworkTitle } from '~/utils/network'

export default function TokenBalanceItem({ tokenBalance }: { tokenBalance: TokenBalance }) {
  return (
    <Box flexDirection="column" gap="2">
      <Text color="text80">{tokenBalance.contractInfo?.name ?? 'Native Token'}</Text>
      <Text color="text80">Network: {getNetworkTitle(tokenBalance.chainId)}</Text>
      <Text color="text80">{ethers.utils.formatEther(tokenBalance.balance)}</Text>
    </Box>
  )
}
