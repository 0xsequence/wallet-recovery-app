import { Box, Button, Card, Image, Modal, Text, TextInput, useMediaQuery } from '@0xsequence/design-system'
import { ChangeEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'

import contractsIcon from '~/assets/icons/contracts.svg'
import walletIcon from '~/assets/icons/wallet.svg'
import bgImageMobile from '~/assets/images/recovery-wallet-bg-mobile.jpg'
import bgImage from '~/assets/images/recovery-wallet-bg.jpg'
import SequenceRecoveryLogo from '~/assets/images/sequence-wallet-recovery.svg'

const desktopBg = {
  backgroundImage: `url(${bgImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center'
}

export default function Landing() {
  const isMobile = useMediaQuery('isMobile')

  const authStore = useStore(AuthStore)
  const isLoadingAccountObservable = useObservable(authStore.isLoadingAccount)

  const [password, setPassword] = useState('')
  const [isReseting, setIsReseting] = useState(false)
  const [wrongPassword, setWrongPassword] = useState(false)
  const [isLoadingAccount, setIsLoadingAccount] = useState(false)

  useEffect(() => {
    setIsLoadingAccount(isLoadingAccountObservable)
  }, [isLoadingAccountObservable])

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
      height={isMobile ? undefined : 'vh'}
      justifyContent={isMobile ? 'center' : 'flex-start'}
      style={isMobile ? { paddingTop: '40px' } : desktopBg}
      padding={isMobile ? '4' : '20'}
      paddingBottom={isMobile ? '14' : '0'}
    >
      <Box
        flexDirection="column"
        justifyContent={isMobile ? 'flex-start' : 'center'}
        alignItems={isMobile ? 'center' : 'flex-start'}
        style={{ maxWidth: '800px' }}
        gap="10"
        zIndex="20"
      >
        <Box
          flexDirection="column"
          justifyContent="center"
          alignItems={isMobile ? 'center' : 'flex-start'}
          gap={isMobile ? undefined : '6'}
        >
          <Image src={SequenceRecoveryLogo} height="8" />

          {isMobile && <Image src={bgImageMobile} style={{ maxWidth: 'calc(100% + 32px)' }} />}

          <Text
            textAlign={isMobile ? 'center' : 'left'}
            variant="xlarge"
            color="text100"
            style={
              isMobile ? { fontSize: '28px', lineHeight: '32px' } : { fontSize: '40px', lineHeight: '44px' }
            }
          >
            A fully open source and forever accessible way to recover your Sequence Wallet
          </Text>
        </Box>

        {isLoadingAccount ? (
          <>
            <Text
              variant="normal"
              fontWeight="medium"
              textAlign="center"
              color="text80"
              paddingX={isMobile ? '8' : undefined}
              style={{ marginBottom: '-16px' }}
            >
              Enter your password to continue and unlock your wallet
            </Text>
            <Box flexDirection="column" gap="4" width="full">
              <Box flexDirection="column" gap="1">
                <Text variant="normal" fontWeight="medium" color="text80">
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
                onClick={() => window.open('https://github.com/0xsequence/wallet-recovery-app')}
              />
              <Button as={Link} to="/recovery-select" label="Start Recovery" variant="primary" size="md" />
            </Box>
            <Box flexDirection={isMobile ? 'column' : 'row'} gap="2" width={isMobile ? 'full' : '2/3'}>
              <Card flexDirection="column" gap="2">
                <Box flexDirection="row" gap="2">
                  <Image src={contractsIcon} />
                  <Text variant="normal" fontWeight="bold" color="text100">
                    Connect to apps
                  </Text>
                </Box>
                <Text variant="normal" fontWeight="medium" color="text50">
                  Connect your wallet to any web3 application via WalletConnect
                </Text>
              </Card>
              <Card flexDirection="column" gap="2">
                <Box flexDirection="row" gap="2">
                  <Image src={walletIcon} />
                  <Text variant="normal" fontWeight="bold" color="text100">
                    Move assets anywhere
                  </Text>
                </Box>
                <Text variant="normal" fontWeight="medium" color="text50">
                  Transfer your assets securely to any wallet, fully decentralized
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
            <Text variant="normal" fontWeight="medium" color="text50">
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
    </Box>
  )
}
