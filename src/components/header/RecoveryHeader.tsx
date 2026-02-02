import { Button, IconButton, MenuIcon, Text, useMediaQuery } from '@0xsequence/design-system'
import { AnimatePresence } from 'framer-motion'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'
import { WalletStore } from '~/stores/WalletStore'

import SettingsDropdownMenu from '~/components/header/WalletDropdownMenu'

import networkIcon from '../../assets/icons/chain.svg'  
import externalArrowIcon from '../../assets/icons/external-link-arrow.svg'
import SequenceRecoveryLogo from '../../assets/images/sequence-wallet-recovery.svg'
import SequenceLogo from '../../assets/images/sequence.svg'

import { MobileDrawerContent } from './MobileDrawerContent'

export const RECOVERY_HEADER_HEIGHT = 61

export default function RecoveryHeader() {
  const isMobile = useMediaQuery('isMobile')

  const authStore = useStore(AuthStore)
  const walletStore = useStore(WalletStore)

  const signedIn = useObservable(authStore.accountAddress)
  const isNavDrawerOpen = useObservable(walletStore.isNavDrawerOpen)

  const openNetworkModal = () => {
    walletStore.isNetworkModalOpen.set(true)
  }

  const toggleNavDrawer = (isOpen: boolean) => {
    walletStore.isNavDrawerOpen.set(isOpen)
  }

  return (
    <div style={{ paddingBottom: `${RECOVERY_HEADER_HEIGHT}px` }} className='flex flex-col'>
      <div className='bg-background-primary fixed w-full z-50'>
        <div
          style={{ height: RECOVERY_HEADER_HEIGHT - 1 }}
          className='flex flex-row justify-between items-center'
        >
          {isMobile ? (
            <>
              <div className='flex flex-row'>
                <AnimatePresence>{isNavDrawerOpen && <MobileDrawerContent />}</AnimatePresence>

                <IconButton
                  variant="text"
                  onClick={() => toggleNavDrawer(!isNavDrawerOpen)}
                  icon={MenuIcon}
                />

                <img src={SequenceLogo} className='ml-5' />
              </div>
              <div className='flex flex-row items-center gap-5 mr-20'>
                {signedIn && <SettingsDropdownMenu />}
              </div>
            </>
          ) : (
            <>
              <img src={SequenceRecoveryLogo} className='ml-5' />
              <div style={{ marginRight: '80px' }} className='flex flex-row items-center gap-5'>
                <Button
                  variant="text"
                  // TODO: change link
                  onClick={() => window.open('https://docs.sequence.xyz/')}
                >
                  <div className='flex flex-row items-center gap-2'>
                    <img src={externalArrowIcon} height="5" />
                    <Text variant="normal" fontWeight="bold" color="text50">
                      Docs
                    </Text>
                  </div>
                </Button>
                <Button
                  variant="text"
                  onClick={() => {
                    openNetworkModal()
                  }}
                >
                  <div className='flex flex-row items-center gap-2'>
                      <img src={networkIcon} height="5" />
                      <Text variant="normal" fontWeight="bold" color="text50">
                        Networks
                      </Text>
                    </div>
</Button>
                {signedIn && <SettingsDropdownMenu />}
              </div>
            </>
          )}
        </div>
        <div className='h-0.5 bg-backgroundBackdrop' />
      </div>
    </div>
  )
}
