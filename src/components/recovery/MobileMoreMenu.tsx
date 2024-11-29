import { Box, Button, Card, Image, MenuIcon, Text } from '@0xsequence/design-system'
import * as PopoverPrimitive from '@radix-ui/react-popover'

import { useObservable, useStore } from '~/stores'
import { WalletStore } from '~/stores/WalletStore'

import networkIcon from '~/assets/icons/chain.svg'
import externalArrowIcon from '~/assets/icons/external-link-arrow.svg'

export default function MobileMoreMenu() {
  const walletStore = useStore(WalletStore)

  const isNavDrawerOpen = useObservable(walletStore.isNavDrawerOpen)
  const isNetworkModalOpen = useObservable(walletStore.isNetworkModalOpen)
  const toggleNavDrawer = () => {
    walletStore.isNavDrawerOpen.set(!isNavDrawerOpen)
  }

  const toggleNetworkModal = () => {
    walletStore.isNetworkModalOpen.set(!isNetworkModalOpen)
  }

  return (
    <PopoverPrimitive.Root open={isNavDrawerOpen} onOpenChange={toggleNavDrawer}>
      <PopoverPrimitive.Trigger asChild>
        <Button variant="text" onClick={() => toggleNavDrawer()} leftIcon={MenuIcon} />
      </PopoverPrimitive.Trigger>

      {isNavDrawerOpen && (
        <PopoverPrimitive.Portal forceMount>
          <PopoverPrimitive.Content asChild side="bottom" sideOffset={8} align="center">
            <Card flexDirection="column" backdropFilter="blur" gap="2">
              <Box
                flexDirection="row"
                alignItems="center"
                background="buttonGlass"
                borderRadius="sm"
                gap="2"
                style={{ cursor: 'pointer', padding: '8px 16px 8px 8px' }}
                onClick={() => window.open('https://docs.sequence.xyz/')}
              >
                <Image src={externalArrowIcon} height="5" />
                <Text variant="normal" fontWeight="bold" color="text100">
                  Docs
                </Text>
              </Box>

              <Box
                flexDirection="row"
                alignItems="center"
                background="buttonGlass"
                borderRadius="sm"
                gap="2"
                style={{ cursor: 'pointer', padding: '8px 16px 8px 8px' }}
                onClick={() => toggleNetworkModal()}
              >
                <Image src={networkIcon} height="5" />
                <Text variant="normal" fontWeight="bold" color="text100">
                  Networks
                </Text>
              </Box>
            </Card>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      )}
    </PopoverPrimitive.Root>
  )
}
