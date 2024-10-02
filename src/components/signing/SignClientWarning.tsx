import { Box, Text } from '@0xsequence/design-system'

export default function SignClientWarning({
  warningType
}: {
  warningType: 'noProvider' | 'isWalletConnect' | 'notDeployed'
}) {
  return (
    <Box>
      <Box flexDirection="column" padding="10" alignItems="center">
        <Text variant="md" fontWeight="bold" color="text100" paddingX="16" paddingBottom="4">
          Please ensure that:
        </Text>
        <Box flexDirection="column">
          <Text variant="md" fontWeight="bold" color="text100" paddingX="16" paddingBottom="1">
            {warningType === 'noProvider' && 'An external wallet is connected via the "Connect" button'}
            {warningType === 'isWalletConnect' &&
              'The external wallet you are using to sign messages cannot be WalletConnect'}
            {warningType === 'notDeployed' &&
              'Your wallet is deployed on the required network before trying to sign messages'}
          </Text>
        </Box>
      </Box>
    </Box>
  )
}
