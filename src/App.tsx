import { Box, Text } from '@0xsequence/design-system'

import sequenceLogo from './assets/images/sequence-logo.svg'

function App() {
  return (
    <Box background="backgroundPrimary" width="full" height="full" alignItems="center" justifyContent="center">
      <Box width="full" style={{ maxWidth: '800px' }}>
        <Box padding="6" marginTop="16">
          <Box flexDirection="column" alignItems="center" justifyContent="center" gap="6">
            <img src={sequenceLogo} alt="Sequence Logo" width="100" />
            <Text variant="large" color="text100" textAlign="center">
              Sequence <br /> Wallet Recovery
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default App
