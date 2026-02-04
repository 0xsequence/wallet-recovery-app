import { Text } from '@0xsequence/design-system'

import { useStore } from '~/stores'
import { WalletStore } from '~/stores/WalletStore'

import networkIcon from '~/assets/icons/chain.svg'
import externalArrowIcon from '~/assets/icons/external-link-arrow.svg'

type MobileDrawerContentProps = {
  topOffset: number
}

export const MobileDrawerContent = ({ topOffset }: MobileDrawerContentProps) => {
  const walletStore = useStore(WalletStore)

  const openNetworkModal = () => {
    walletStore.isNetworkModalOpen.set(true)
  }

  const toggleNavDrawer = (isOpen: boolean) => {
    walletStore.isNavDrawerOpen.set(isOpen)
  }

  return (
    <div
      className='fixed left-0 w-vw h-vh bg-backgroundOverlay flex flex-row lg:hidden z-20'
      style={{
        top: topOffset
      }}
    >
      <div
        style={{ width: '75%' }}
        className="absolute bg-background-primary flex flex-col gap-5 h-full max-h-screen overflow-y-scroll px-3 md:px-6 py-4 md:py-6 border-l border-backgroundBackdrop"
      >
        <div
          className='flex flex-row gap-2'
          onClick={() => window.open('https://docs.sequence.xyz/')}
        >
          <img src={externalArrowIcon} height="5" />
          <Text variant="normal" fontWeight="bold" color="text50">
            Docs
          </Text>
        </div>

        <div
          className='flex flex-row gap-2'
          onClick={() => {
            openNetworkModal()
            toggleNavDrawer(false)
          }}
        >
          <img src={networkIcon} height="5" />
          <Text variant="normal" fontWeight="bold" color="text50">
            Networks
          </Text>
        </div>
      </div>
    </div>
  )
}
