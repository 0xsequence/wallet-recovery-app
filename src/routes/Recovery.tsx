import { Box, Button, Card, Text } from '@0xsequence/design-system'
import { Link } from 'react-router-dom'

import sequenceLogo from '../assets/images/sequence-logo.svg'

function Recovery() {
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

        <Box marginTop="16">
          <Card flexDirection="column" gap="6">
            <Text variant="medium" color="text100" textAlign="center">
              Enter your recovery phrase
            </Text>

            <Text variant="normal" color="text100" marginBottom="4">
              Input will be here
            </Text>
          </Card>
        </Box>

        <Box alignItems="center" justifyContent="center" flexDirection="column">
          <Box>
            <Button variant="primary" size="lg" shape="square" label="Continue" width="full" marginTop="16" />
          </Box>
          <Box>
            <Button
              as={Link}
              to="/"
              variant="text"
              size="lg"
              shape="square"
              label="Go back to start"
              width="full"
              marginTop="6"
            />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default Recovery
