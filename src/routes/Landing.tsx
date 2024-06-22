import { Link } from 'react-router-dom'
import { Box, Button, Card, Image, Spinner, Text } from '@0xsequence/design-system'

import sequenceLogo from '../assets/images/sequence-logo.svg'
import { useObservable, useStore } from '../stores'
import { AuthStore } from '../stores/AuthStore'

function Landing() {
  const authStore = useStore(AuthStore)
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

        {!isLoadingAccount && (
          <>
            <Box marginTop="8">
              <Card flexDirection="column" gap="6">
                <Text variant="medium" color="warning" textAlign="center">
                  Warning section
                </Text>

                <Text variant="normal" color="text100" marginBottom="4">
                  At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium
                  voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati
                  cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id
                  est laborum et dolorum fuga. At vero eos et accusamus et iusto odio dignissimos ducimus qui
                  blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias
                  excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia
                  deserunt mollitia animi, id est laborum et dolorum fuga.
                </Text>
              </Card>
            </Box>

            <Box alignItems="center" justifyContent="center" flexDirection="column">
              <Box>
                <Button
                  as={Link}
                  to="/recovery"
                  variant="primary"
                  size="lg"
                  shape="square"
                  label="Start Recovery"
                  width="full"
                  marginTop="16"
                />
              </Box>
              <Box>
                <Button
                  variant="text"
                  size="lg"
                  shape="square"
                  label="Learn more"
                  width="full"
                  marginTop="6"
                />
              </Box>
            </Box>
          </>
        )}

        {isLoadingAccount && (
          <Box marginTop="8" alignItems="center" justifyContent="center">
            <Card width="16" alignItems="center" justifyContent="center">
              <Spinner size="lg" />
            </Card>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default Landing
