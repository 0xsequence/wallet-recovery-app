import { Box, Button, Card, Image, Modal, Text, TextInput } from '@0xsequence/design-system'
import { ChangeEvent, useState } from 'react'
import { Link } from 'react-router-dom'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'

import RecoveryFooter from '~/components/recovery/RecoveryFooter'

import contractsIcon from '~/assets/icons/contracts.svg'
import walletIcon from '~/assets/icons/wallet.svg'
import SequenceRecoveryLogo from '~/assets/images/sequence-wallet-recovery.svg'

function Landing() {
  const authStore = useStore(AuthStore)
  const isLoadingAccount = useObservable(authStore.isLoadingAccount)

  const [password, setPassword] = useState('')
  const [isReseting, setIsReseting] = useState(false)
  const [wrongPassword, setWrongPassword] = useState(false)

  const handleUnlock = async () => {
    try {
      await authStore.loadAccount(password)
    } catch (e) {
      console.warn(e)
      setWrongPassword(true)
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
      justifyContent="center"
      height="vh"
      style={{ background: 'linear-gradient(to bottom, #280a6b, #000000 50%)' }}
    >
      <Box
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="full"
        style={{ maxWidth: '1000px' }}
        gap="10"
      >
        <Box flexDirection="column" gap="6">
          <Image src={SequenceRecoveryLogo} height="8" />

          <Text
            textAlign="center"
            variant="xlarge"
            color="text100"
            style={{ fontSize: '40px', lineHeight: '44px' }}
          >
            A fully open source and forever accessible way to recover your Sequence Wallet
          </Text>
        </Box>

        {isLoadingAccount ? (
          <>
            <Text variant="normal" color="text100">
              Enter your password to continue and unlock your wallet
            </Text>
            <Box flexDirection="column" gap="4" width="3/4">
              <Box flexDirection="column" gap="1">
                <Text variant="normal" color="text100">
                  Password
                </Text>
                <TextInput
                  type="password"
                  value={password}
                  autoFocus
                  onKeyPress={(ev: KeyboardEvent) => {
                    if (ev.key === 'Enter') {
                      handleUnlock()
                    }
                  }}
                  onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                    setPassword(ev.target.value)
                    setWrongPassword(false)
                  }}
                />
                {wrongPassword && (
                  <Text variant="small" color="negative" marginLeft="2" marginTop="1">
                    Incorrect password
                  </Text>
                )}
              </Box>
              <Box flexDirection="row" justifyContent="flex-end" gap="4">
                <Button
                  label="Forgot password?"
                  variant="text"
                  shape="square"
                  onClick={() => handleResetConfirmation()}
                />
                <Button label="Continue" variant="primary" shape="square" onClick={() => handleUnlock()} />
              </Box>
            </Box>
          </>
        ) : (
          <>
            <Box gap="2">
              {/* TODO: Change link */}
              <Button
                label="Learn more"
                size="md"
                onClick={() => window.open('https://docs.sequence.xyz/')}
              />
              <Button as={Link} to="/recovery" label="Start Recovery" variant="primary" size="md" />
            </Box>
            <Box flexDirection="row" gap="2" width="2/3">
              <Card flexDirection="column" gap="2">
                <Box flexDirection="row" gap="2">
                  <Image src={contractsIcon} />
                  <Text variant="normal" fontWeight="bold" color="text100">
                    Connect to Applications
                  </Text>
                </Box>
                <Text variant="normal" color="text50">
                  Connect your wallet to any web3 application via Walletconnect
                </Text>
              </Card>
              <Card flexDirection="column" gap="2">
                <Box flexDirection="row" gap="2">
                  <Image src={walletIcon} />
                  <Text variant="normal" fontWeight="bold" color="text100">
                    Move funds anywhere
                  </Text>
                </Box>
                <Text variant="normal" color="text50">
                  Transfer funds securely to any wallet, fully decentralized
                </Text>
              </Card>
            </Box>
          </>
        )}
      </Box>

      {isReseting && (
        <Modal size="md" onClose={() => setIsReseting(false)}>
          <Box flexDirection="column" padding="6" gap="6">
            <Text variant="large" color="text100" marginRight="8">
              Are you sure you want to sign out?
            </Text>
            <Text variant="normal" color="text50">
              If you do not remember your password, you can reset and start over.
              <br /> This will require you to re-enter your mnemonic.
            </Text>
            <Box flexDirection="row" justifyContent="flex-end" gap="2">
              <Button label="Yes, reset" shape="square" variant="primary" onClick={() => handleReset()} />
              <Button label="Cancel" shape="square" onClick={() => setIsReseting(false)} />
            </Box>
          </Box>
        </Modal>
      )}

      <RecoveryFooter />
    </Box>
  )
}

export default Landing
