import { Box, Card, Text } from '@0xsequence/design-system'

export default function SignClientWarning({
  warningType
}: {
  warningType: 'noProvider' | 'isWalletConnect' | 'notDeployed'
}) {
  return (
    <Box>
      <Box flexDirection="column" padding="10" alignItems="center" gap="6">
        <Text variant="md" fontWeight="bold" color="text100">
          Warning:
        </Text>
        <Box flexDirection="column">
          <Card>
            <Text variant="md" fontWeight="bold" color="text100" paddingX="2">
              {warningType === 'noProvider' &&
                'Please ensure that an external wallet is connected via the "Connect" button'}
              {warningType === 'isWalletConnect' &&
                'Please switch your external wallet to an option other than WalletConnect'}
              {warningType === 'notDeployed' &&
                'Please deploy our wallet on the required network before trying to sign messages'}
            </Text>
          </Card>
        </Box>
      </Box>
    </Box>
  )
}
