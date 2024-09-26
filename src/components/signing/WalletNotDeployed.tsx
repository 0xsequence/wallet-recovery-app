import { Box, Text } from '@0xsequence/design-system'

export default function WalletNotDeployed() {
  return (
    <Box>
      <Box flexDirection="column" padding="10" alignItems="center">
        <Text variant="md" fontWeight="bold" color="text100" paddingX="16" paddingBottom="2">
          Please ensure that an external wallet is connected via the "Connect" button or that
        </Text>
        <Text variant="md" fontWeight="bold" color="text100" paddingX="16">
          your wallet is deployed on the required network before trying to sign messages
        </Text>
      </Box>
    </Box>
  )
}
