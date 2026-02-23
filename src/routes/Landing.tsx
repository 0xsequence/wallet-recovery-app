import { Button, Card, Text, cn, useMediaQuery } from '@0xsequence/design-system'
import { useNavigate } from 'react-router-dom'

import contractsIcon from '~/assets/icons/contracts.svg'
import walletIcon from '~/assets/icons/wallet.svg'
import bgImageMobile from '~/assets/images/recovery-wallet-bg-mobile.jpg'
import bgImage from '~/assets/images/recovery-wallet-bg.jpg'
import SequenceRecoveryLogo from '~/assets/images/sequence.svg'

const desktopBg = {
  backgroundImage: `url(${bgImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center'
}

export default function Landing() {
  const isMobile = useMediaQuery('isMobile')
  const navigate = useNavigate()

  return (
    <div
      className="h-dvh flex justify-center lg:justify-start p-4 pb-0 pt-10 sm:pt-16 lg:pt-0"
      style={isMobile ? undefined : desktopBg}
    >
      <div className="flex flex-col justify-start lg:justify-center items-center lg:items-start w-full max-w-800px gap-8 sm:gap-10 z-20 px-4 sm:px-8 lg:px-20 py-10 sm:py-16 lg:py-20">
        <div className="flex flex-col justify-center items-center lg:items-start gap-6 w-full">
          <div className="flex flex-row items-center gap-2">
            <img src={SequenceRecoveryLogo} className="h-8 sm:h-9 mr-2" />
            <div className="flex items-center gap-1 ">
              <Text variant="xlarge" fontWeight="bold" className="text-primary">
                Sequence
              </Text>
              <Text variant="xlarge" fontWeight="bold" className="text-primary/70">
                Wallet Recovery
              </Text>
            </div>
          </div>

          {isMobile && <img src={bgImageMobile} className="w-full max-w-none rounded-lg" />}

          <Text
            color="text100"
            className={cn(
              'w-full lg:w-3/5 text-2xl sm:text-3xl lg:text-4xl leading-tight',
              isMobile ? 'text-center' : 'text-left'
            )}
          >
            A fully open source and forever accessible way to recover your Sequence Wallet
          </Text>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* TODO: Change link */}
          <Button size="md" onClick={() => window.open('https://github.com/0xsequence/wallet-recovery-app')}>
            Learn more
          </Button>

          <Button variant="primary" onClick={() => navigate('/recovery')}>
            Start Recovery
          </Button>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-2/3 select-none">
          <Card className="flex flex-col gap-2 w-full">
            <div className="flex flex-row gap-2">
              <img src={contractsIcon} className="w-4 h-4" />

              <Text variant="normal" fontWeight="bold" className="text-primary">
                Connect to apps
              </Text>
            </div>
            <Text variant="normal" fontWeight="medium" className="text-primary/50">
              Connect your wallet to any web3 application via WalletConnect
            </Text>
          </Card>
          <Card className="flex flex-col gap-2 w-full">
            <div className="flex flex-row gap-2">
              <img src={walletIcon} className="w-4 h-4" />

              <Text variant="normal" fontWeight="bold" className="text-primary">
                Move assets anywhere
              </Text>
            </div>

            <Text variant="normal" fontWeight="medium" className="text-primary/50">
              Transfer your assets securely to any wallet, fully decentralized
            </Text>
          </Card>
        </div>
      </div>
    </div>
  )
}
