import { Button, Card, cn, Text, useMediaQuery } from '@0xsequence/design-system'
import { useEffect, useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'

import contractsIcon from '~/assets/icons/contracts.svg'
import walletIcon from '~/assets/icons/wallet.svg'
import bgImageMobile from '~/assets/images/recovery-wallet-bg-mobile.jpg'
import bgImage from '~/assets/images/recovery-wallet-bg.jpg'
import SequenceRecoveryLogo from '~/assets/images/sequence-wallet-recovery.svg'
import { PasswordUnlock } from '~/components/auth/PasswordUnlock'
import { useNavigate } from 'react-router-dom'

const desktopBg = {
  backgroundImage: `url(${bgImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center'
}

export default function Landing() {
  const isMobile = useMediaQuery('isMobile')
  const authStore = useStore(AuthStore)
  const isLoadingAccountObservable = useObservable(authStore.isLoadingAccount)
  const navigate = useNavigate()

  const [isLoadingAccount, setIsLoadingAccount] = useState(false)

  useEffect(() => {
    setIsLoadingAccount(isLoadingAccountObservable)
  }, [isLoadingAccountObservable])

  return (
    <div
      className='h-dvh flex justify-center lg:justify-start pt-20 lg:pt-0 p-4 pb-0'
      style={isMobile ? { paddingTop: '40px' } : desktopBg}
    >
      <div className='flex flex-col justify-start lg:justify-center items-center lg:items-start max-w-800px gap-10 z-20 p-20'>
        <div className='flex flex-col justify-center items-center lg:items-start gap-6'>
          <img src={SequenceRecoveryLogo} className='h-8' />

          {isMobile && <img src={bgImageMobile} className='max-w-calc(100% + 32px)' />}

          <Text color="text100" className={cn("w-3/5 text-4xl", isMobile ? 'text-center' : 'text-left')}>
            A fully open source and forever accessible way to recover your Sequence Wallet
          </Text>
        </div>

        {isLoadingAccount ? (
          <PasswordUnlock redirectOnSuccess={true} />
        ) : (
          <>
            <div className='flex flex-row gap-2'>
              {/* TODO: Change link */}
              <Button
                size="md"
                onClick={() => window.open('https://github.com/0xsequence/wallet-recovery-app')}
              >
                Learn more</Button>

              <Button variant="primary" onClick={() => navigate('/recovery')}>Start Recovery</Button>
            </div>
            <div className='flex flex-col lg:flex-row gap-2 w-full lg:w-1/2 select-none'>
              <Card className='flex flex-col gap-2'>
                <div className='flex flex-row gap-2'>
                  <img src={contractsIcon} className='w-4 h-4' />

                  <Text variant="normal" fontWeight="bold" className='text-primary'>
                    Connect to apps
                  </Text>
                </div>
                <Text variant="normal" fontWeight="medium" className='text-primary/50'>
                  Connect your wallet to any web3 application via WalletConnect
                </Text>
              </Card>
              <Card className='flex flex-col gap-2'>
                <div className='flex flex-row gap-2'>
                  <img src={walletIcon} className='w-4 h-4' />

                  <Text variant="normal" fontWeight="bold" className='text-primary'>
                    Move assets anywhere
                  </Text>
                </div>

                <Text variant="normal" fontWeight="medium" className='text-primary/50'>
                  Transfer your assets securely to any wallet, fully decentralized
                </Text>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
