import { Box, Button, Card, Text } from '@0xsequence/design-system'

import { useObservable, useStore } from '../stores'
import { AuthStore } from '../stores/AuthStore'

import sequenceLogo from '../assets/images/sequence-logo.svg'

function Wallet() {
  const authStore = useStore(AuthStore)

  const accountAddress = useObservable(authStore.accountAddress)

  return (
    <Box
      flexDirection="column"
      background="backgroundPrimary"
      width="full"
      height="full"
      alignItems="center"
      justifyContent="center"
    >
      <Box flexDirection="row" width="full" background="backgroundMuted" paddingX="8" paddingY="4" alignItems="center">
        <img src={sequenceLogo} alt="Sequence Logo" width="40" />
        <Box marginLeft="auto">
          <Button label="Networks" variant="text" marginRight="8" />
          <Button label="Settings" variant="text" />
        </Box>
      </Box>
      <Box width="full" style={{ maxWidth: '800px' }}>
        <Card alignItems="center" flexDirection="column" padding="6" marginTop="16">
          <Text variant="large" color="text80" marginBottom="4">
            Your recovered wallet address
          </Text>
          <Text variant="normal" color="text100">
            {accountAddress}
          </Text>
        </Card>
      </Box>
    </Box>
  )
}

export default Wallet
