import { Box, Button, Card, Image, Text, useMediaQuery } from '@0xsequence/design-system'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'

import contractsIcon from '~/assets/icons/contracts.svg'
import walletIcon from '~/assets/icons/wallet.svg'
import bgImageMobile from '~/assets/images/recovery-wallet-bg-mobile.jpg'
import bgImage from '~/assets/images/recovery-wallet-bg.jpg'
import SequenceRecoveryLogo from '~/assets/images/sequence-wallet-recovery.svg'
import { PasswordUnlock } from '~/components/auth/PasswordUnlock'

const desktopBg = {
  backgroundImage: `url(${bgImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center'
}

export default function Landing() {
  const isMobile = useMediaQuery('isMobile')
  const authStore = useStore(AuthStore)
  const isLoadingAccountObservable = useObservable(authStore.isLoadingAccount)

  const [isLoadingAccount, setIsLoadingAccount] = useState(false)

  useEffect(() => {
    setIsLoadingAccount(isLoadingAccountObservable)
  }, [isLoadingAccountObservable])

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
          <PasswordUnlock redirectOnSuccess={true} />
        ) : (
          <>
            <Box gap="2">
              {/* TODO: Change link */}
              <Button
                label="Learn more"
                size="md"
                onClick={() => window.open('https://github.com/0xsequence/wallet-recovery-app')}
              />
              <Button as={Link} to="/recovery" label="Start Recovery" variant="primary" size="md" />
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
    </Box>
  )
}
