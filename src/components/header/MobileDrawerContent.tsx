import { Box, Image, Text } from '@0xsequence/design-system'
import { motion } from 'framer-motion'

import { useStore } from '~/stores'
import { WalletStore } from '~/stores/WalletStore'

import networkIcon from '~/assets/icons/chain.svg'
import externalArrowIcon from '~/assets/icons/external-link-arrow.svg'

import { RECOVERY_HEADER_HEIGHT } from './RecoveryHeader'
import { navDrawer } from './styles.css'

export const MobileDrawerContent = () => {
  const walletStore = useStore(WalletStore)

  const openNetworkModal = () => {
    walletStore.isNetworkModalOpen.set(true)
  }

  const toggleNavDrawer = (isOpen: boolean) => {
    walletStore.isNavDrawerOpen.set(isOpen)
  }

  return (
    <Box
      as={motion.div}
      background="backgroundOverlay"
      className={navDrawer}
      display={{
        sm: 'flex',
        lg: 'none'
      }}
      flexDirection="row"
      transition={{ type: 'just' }}
      zIndex="20"
      style={{
        top: RECOVERY_HEADER_HEIGHT
      }}
    >
      <Box
        position="absolute"
        animate={{ left: 0 }}
        as={motion.div}
        background="backgroundPrimary"
        exit={{ left: '-100%' }}
        flexDirection="column"
        gap="5"
        height="full"
        initial={{ left: '-100%' }}
        maxHeight="vh"
        overflowY="scroll"
        paddingX={{ sm: '3', md: '6' }}
        paddingY={{ sm: '4', md: '6' }}
        transition={{ type: 'just' }}
        borderLeftWidth="thin"
        borderLeftStyle="solid"
        borderLeftColor="backgroundBackdrop"
        style={{ width: '75%' }}
      >
        <Box
          // flexDirection="row"
          // alignItems="center"
          // background="buttonGlass"
          // borderRadius="sm"
          gap="2"
          // style={{ cursor: 'pointer', padding: '8px 16px 8px 8px' }}
          onClick={() => window.open('https://docs.sequence.xyz/')}
        >
          <Image src={externalArrowIcon} height="5" />
          <Text variant="normal" fontWeight="bold" color="text50">
            Docs
          </Text>
        </Box>

        <Box
          // flexDirection="row"
          // alignItems="center"
          // background="buttonGlass"
          // borderRadius="sm"
          gap="2"
          // style={{ cursor: 'pointer', padding: '8px 16px 8px 8px' }}
          onClick={() => {
            openNetworkModal()
            toggleNavDrawer(false)
          }}
        >
          <Image src={networkIcon} height="5" />
          <Text variant="normal" fontWeight="bold" color="text50">
            Networks
          </Text>
        </Box>
      </Box>
    </Box>
  )
}
