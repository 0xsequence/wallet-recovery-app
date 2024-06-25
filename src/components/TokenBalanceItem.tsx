import { Box, Text } from '@0xsequence/design-system'
import { ContractType, TokenBalance } from '@0xsequence/indexer'
import { ethers } from 'ethers'

export default function TokenBalanceItem({ tokenBalance }: { tokenBalance: TokenBalance }) {
  return (
    <Box flexDirection="column" gap="2">
      <Text color="text80">{tokenBalance.contractType === ContractType.NATIVE ? 'Native' : ''}</Text>
      <Text color="text80">{ethers.utils.formatEther(tokenBalance.balance)}</Text>
    </Box>
  )
}
