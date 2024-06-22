import { Box, Button, Card, Spinner, Text, TextArea } from '@0xsequence/design-system'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'

import sequenceLogo from '~/assets/images/sequence-logo.svg'

function Recovery() {
  const authStore = useStore(AuthStore)
  const [mnemonic, setMnemonic] = useState('')

  const isLoadingAccount = useObservable(authStore.isLoadingAccount)

  return (
    <Box
      background="backgroundPrimary"
      width="full"
      height="full"
      paddingX="8"
      alignItems="center"
      justifyContent="center"
    >
      <Box width="full" style={{ maxWidth: '800px' }}>
        <Box padding="6" marginTop="16">
          <Box flexDirection="column" alignItems="center" justifyContent="center" gap="6">
            <img src={sequenceLogo} alt="Sequence Logo" style={{ width: '100px', height: '100px' }} />
            <Text variant="large" color="text100" textAlign="center">
              Sequence <br /> Wallet Recovery
            </Text>
          </Box>
        </Box>

        <Box marginTop="12">
          <Box alignItems="center" justifyContent="center" flexDirection="column">
            <Text variant="medium" color="text100" textAlign="center">
              Enter your recovery phrase
            </Text>

            <Text variant="normal" color="text50" marginTop="4" textAlign="center">
              This is the recovery phrase you create on sequence.app/settings/recovery
            </Text>
          </Box>

          <Box marginTop="12">
            <TextArea
              name="mnemonic"
              label="Recovery Phrase"
              labelLocation="top"
              value={mnemonic}
              onChange={ev => setMnemonic(ev.target.value)}
            />
          </Box>
        </Box>

        <Box alignItems="center" justifyContent="center" flexDirection="column">
          {isLoadingAccount && (
            <Box marginTop="16" alignItems="center" justifyContent="center">
              <Card width="16" alignItems="center" justifyContent="center">
                <Spinner size="lg" />
              </Card>
            </Box>
          )}
          {!isLoadingAccount && (
            <>
              <Box>
                <Button
                  variant="primary"
                  size="lg"
                  shape="square"
                  label="Continue"
                  onClick={() => {
                    authStore.signInWithRecoveryMnemonic(mnemonic)
                  }}
                  width="full"
                  marginTop="16"
                />
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
            </>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default Recovery
