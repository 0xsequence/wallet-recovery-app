import { Box, Button, Card, Modal, Spinner, Text } from '@0xsequence/design-system'
import { ChangeEvent, useState } from 'react'
import { Link } from 'react-router-dom'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'

import { PasswordInput } from '~/components/PasswordInput'

import sequenceLogo from '~/assets/images/sequence-logo.svg'

function Landing() {
  const authStore = useStore(AuthStore)
  const isLoadingAccount = useObservable(authStore.isLoadingAccount)
  const isPromptingForPassword = useObservable(authStore.isPromptingForPassword)

  const [password, setPassword] = useState('')
  const [isReseting, setIsReseting] = useState(false)
  const [wrongPassword, setWrongPassword] = useState(false)

  const handleUnlock = async () => {
    try {
      await authStore.loadAccount(password)
    } catch (e) {
      setWrongPassword(true)
      console.warn(e)
    }
  }

  const handleResetConfirmation = () => {
    setIsReseting(true)
  }

  const handleReset = () => {
    authStore.logout()
    setIsReseting(false)
    authStore.isLoadingAccount.set(false)
  }

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
          <>
            {isPromptingForPassword ? (
              <Box flexDirection="column" marginTop="8" justifyContent="center" alignItems="center">
                <Text variant="large" color="text100" marginBottom="8">
                  Weclome back!
                </Text>
                <PasswordInput
                  label="Password"
                  value={password}
                  onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                    setPassword(ev.target.value)
                    setWrongPassword(false)
                  }}
                ></PasswordInput>
                {wrongPassword ? (
                  <Text alignSelf="flex-start" variant="small" color="negative" marginLeft="2" marginTop="1">
                    Incorrect password
                  </Text>
                ) : (
                  <Text variant="small" color="backgroundPrimary" marginLeft="2" marginTop="1">
                    Incorrect password
                  </Text>
                )}
                <Button
                  marginTop="4"
                  marginBottom="2"
                  variant="primary"
                  size="lg"
                  shape="square"
                  label="Unlock"
                  disabled={!password}
                  onClick={() => {
                    handleUnlock()
                  }}
                />
                <Box>
                  <Button
                    variant="text"
                    label="The dog ate my password (Forgot Password)"
                    onClick={() => {
                      handleResetConfirmation()
                    }}
                  />
                </Box>
              </Box>
            ) : (
              <Box marginTop="8" alignItems="center" justifyContent="center">
                <Card width="16" alignItems="center" justifyContent="center">
                  <Spinner size="lg" />
                </Card>
              </Box>
            )}
          </>
        )}
      </Box>
      {isReseting && (
        <Modal size="md" onClose={() => setIsReseting(false)}>
          <Card flexDirection="column" alignItems="center" padding="16">
            <Text variant="md" fontWeight="bold" color="text100">
              Click "Reset" to START OVER and re-enter your mnemonic
            </Text>
            <Box flexDirection={{ sm: 'column', md: 'row' }} gap="2" width="full" marginTop="10">
              <Button
                width="full"
                label={`Cancel`}
                onClick={() => {
                  setIsReseting(false)
                }}
                data-id="signingCancel"
              />

              <Button
                width="full"
                variant="primary"
                label={'Reset'}
                onClick={() => {
                  handleReset()
                }}
                data-id="signingContinue"
              />
            </Box>
          </Card>
        </Modal>
      )}
    </Box>
  )
}

export default Landing
