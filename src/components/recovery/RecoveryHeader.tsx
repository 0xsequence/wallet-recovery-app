import { Box, Button, Divider, Image, MenuIcon, Text, useMediaQuery } from '@0xsequence/design-system'
import { AnimatePresence } from 'framer-motion'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'
import { WalletStore } from '~/stores/WalletStore'

import SettingsDropdownMenu from '~/components/wallet/WalletDropdownMenu'

import networkIcon from '~/assets/icons/chain.svg'
import externalArrowIcon from '~/assets/icons/external-link-arrow.svg'
import SequenceRecoveryLogo from '~/assets/images/sequence-wallet-recovery.svg'
import SequenceLogo from '~/assets/images/sequence.svg'

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
    <Box flexDirection="column" style={{ paddingBottom: `${RECOVERY_HEADER_HEIGHT}px` }}>
      <Box background="backgroundPrimary" position="fixed" width="full">
        <Box
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          style={{ height: RECOVERY_HEADER_HEIGHT - 1 }}
        >
          {isMobile ? (
            <>
              <Box paddingLeft="5" flexDirection="row">
                <AnimatePresence>{isNavDrawerOpen && <MobileDrawerContent />}</AnimatePresence>

                <Button
                  variant="text"
                  onClick={() => toggleNavDrawer(!isNavDrawerOpen)}
                  leftIcon={MenuIcon}
                />

                <Image src={SequenceLogo} paddingLeft="5" />
              </Box>
              <Box flexDirection="row" alignItems="center" gap="5" style={{ marginRight: '80px' }}>
                {signedIn && <SettingsDropdownMenu />}
              </Box>
            </>
          ) : (
            <>
              <Image src={SequenceRecoveryLogo} paddingLeft="5" />
              <Box flexDirection="row" alignItems="center" gap="5" style={{ marginRight: '80px' }}>
                <Button
                  label={
                    <Box flexDirection="row" alignItems="center" gap="2">
                      <Image src={externalArrowIcon} height="5" />
                      <Text variant="normal" fontWeight="bold" color="text50">
                        Docs
                      </Text>
                    </Box>
                  }
                  variant="text"
                  // TODO: change link
                  onClick={() => window.open('https://docs.sequence.xyz/')}
                />
                <Button
                  label={
                    <Box flexDirection="row" alignItems="center" gap="2">
                      <Image src={networkIcon} height="5" />
                      <Text variant="normal" fontWeight="bold" color="text50">
                        Networks
                      </Text>
                    </Box>
                  }
                  variant="text"
                  onClick={() => {
                    openNetworkModal()
                  }}
                />
                {signedIn && <SettingsDropdownMenu />}
              </Box>
            </>
          )}
        </Box>
        <Divider marginY="0" />
      </Box>
    </Box>
  )
}
