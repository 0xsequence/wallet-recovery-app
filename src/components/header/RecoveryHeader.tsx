import { Button, IconButton, MenuIcon, Text, useMediaQuery } from '@0xsequence/design-system'
import { AnimatePresence } from 'framer-motion'
import { useLayoutEffect, useRef, useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'
import { WalletStore } from '~/stores/WalletStore'

import SettingsDropdownMenu from '~/components/header/WalletDropdownMenu'

import networkIcon from '../../assets/icons/chain.svg'
import externalArrowIcon from '../../assets/icons/external-link-arrow.svg'
import { default as SequenceLogo, default as SequenceRecoveryLogo } from '../../assets/images/sequence.svg'
import { MobileDrawerContent } from './MobileDrawerContent'

export const RECOVERY_HEADER_HEIGHT = 61

export default function RecoveryHeader() {
  const isMobile = useMediaQuery('isMobile')

  const authStore = useStore(AuthStore)
  const walletStore = useStore(WalletStore)

  const signedIn = useObservable(authStore.accountAddress)
  const isNavDrawerOpen = useObservable(walletStore.isNavDrawerOpen)
  const headerRef = useRef<HTMLDivElement | null>(null)
  const [headerHeight, setHeaderHeight] = useState(RECOVERY_HEADER_HEIGHT)

  useLayoutEffect(() => {
    const headerEl = headerRef.current
    if (!headerEl) {
      return
    }

    const updateHeaderHeight = () => {
      setHeaderHeight(headerEl.offsetHeight || RECOVERY_HEADER_HEIGHT)
    }

    updateHeaderHeight()

    const resizeObserver = new ResizeObserver(updateHeaderHeight)
    resizeObserver.observe(headerEl)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  const openNetworkModal = () => {
    walletStore.isNetworkModalOpen.set(true)
  }

  const toggleNavDrawer = (isOpen: boolean) => {
    walletStore.isNavDrawerOpen.set(isOpen)
  }

  return (
    <div style={{ paddingBottom: `${headerHeight}px` }} className="flex flex-col">
      <div ref={headerRef} className="bg-background-primary fixed w-full z-50">
        <div
          style={{ minHeight: RECOVERY_HEADER_HEIGHT - 1 }}
          className="flex flex-row flex-wrap justify-between items-center gap-3 px-4 py-2 sm:px-6"
        >
          {isMobile ? (
            <>
              <div className="flex flex-row items-center gap-2 shrink-0">
                <AnimatePresence>
                  {isNavDrawerOpen && <MobileDrawerContent topOffset={headerHeight} />}
                </AnimatePresence>

                <IconButton
                  variant="text"
                  onClick={() => toggleNavDrawer(!isNavDrawerOpen)}
                  icon={MenuIcon}
                />

                <img src={SequenceLogo} className="ml-2 h-5 w-auto" />
              </div>
              <div className="flex flex-row flex-wrap items-center gap-3">
                {signedIn && <SettingsDropdownMenu />}
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-row items-center gap-2">
                <img src={SequenceRecoveryLogo} className="h-5 w-auto shrink-0" />
                <div className="flex items-center gap-1">
                  <Text variant="large" fontWeight="medium" className="text-primary">
                    Sequence
                  </Text>
                  <Text variant="large" fontWeight="medium" className="text-primary/70">
                    Wallet Recovery
                  </Text>
                </div>
              </div>
              <div className="flex flex-row flex-wrap items-center gap-4">
                <Button
                  variant="text"
                  // TODO: change link
                  onClick={() => window.open('https://docs.sequence.xyz/')}
                >
                  <div className="flex flex-row items-center gap-2">
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
                  <div className="flex flex-row items-center gap-2">
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
        <div className="h-0.5 bg-backgroundBackdrop" />
      </div>
    </div>
  )
}
