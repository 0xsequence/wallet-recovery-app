import { Box, Text } from '@0xsequence/design-system'

export default function WalletNotDeployed() {
  return (
    <Box>
      <Box flexDirection="column" padding="10" alignItems="center">
        <Text variant="md" fontWeight="bold" color="text100" paddingX="16" paddingBottom="1">
          Please connect an external wallet or deploy your wallet to the required network to sign messages
        </Text>
      </Box>
    </Box>
  )
}
