import { Box, Button, ChevronLeftIcon, Divider, Text } from '@0xsequence/design-system'
import { Link } from 'react-router-dom'

import RecoveryHeader from '~/components/header/RecoveryHeader'

import { WALLET_WIDTH } from './Wallet'

function RecoverySelect() {
  return (
    <Box flexDirection="column" background="backgroundPrimary">
      <RecoveryHeader />

      <Box
        alignSelf="center"
        flexDirection="column"
        marginY="10"
        paddingX="4"
        gap="4"
        width="full"
        style={{ maxWidth: WALLET_WIDTH }}
      >
        <Button leftIcon={ChevronLeftIcon} label="Back" size="sm" as={Link} to="/" />

        <Box flexDirection="column">
          <Text variant="xlarge" color="text80">
            Select mnemonic length
          </Text>

          <Divider marginY="6" />

          <Box flexDirection="column" gap="2">
            <Text variant="h2" fontWeight="medium" color="text80">
              How many words is your recovery phrase?
            </Text>

            <Text variant="normal" fontWeight="medium" color="text50" marginBottom="1">
              Select the number of words in your recovery phrase. A 12 word mnemonic indicate a version 2
              wallet, while a 24 word mnemonic indicate a version 3 wallet.
            </Text>
          </Box>

          <Box flexDirection="row" gap="2" paddingTop="6">
            <Button as={Link} to="/recovery-v2" label="12 word mnemonic" variant="primary" size="md" />
            <Button as={Link} to="/recovery-v3" label="24 word mnemonic" variant="primary" size="md" />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default RecoverySelect
