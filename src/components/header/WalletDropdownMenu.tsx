import {
  Button,
  Card,
  CheckmarkIcon,
  CopyIcon,
  GradientAvatar,
  Modal,
  SignoutIcon,
  Text,
} from '@0xsequence/design-system'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'

import ConfirmSignOut from '~/components/wallet/ConfirmSignOut'
import { truncateNumber } from '~/utils/bignumber'

export default function SettingsDropdownMenu() {
  const authStore = useStore(AuthStore)

  const walletAddress = useObservable(authStore.accountAddress)

  const [isOpen, toggleOpen] = useState(false)
  const [isConfirmSignOutModalOpen, setIsConfirmSignOutModalOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isCopied])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(walletAddress!)
    setIsCopied(true)
  }

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={toggleOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          variant="text"
        >
          <div className='flex flex-row items-center gap-2'>
            <GradientAvatar address={walletAddress!} size="sm" />
            <Text variant="normal" fontWeight="bold" color="text100">
              {truncateNumber(Number(walletAddress!), 4)}
            </Text>
          </div>
        </Button>
      </PopoverPrimitive.Trigger>

      {isOpen && (
        <PopoverPrimitive.Portal forceMount>
          <PopoverPrimitive.Content asChild side="bottom" sideOffset={8} align="center">
            <Card className='flex flex-col backdrop-blur-sm gap-2'>
              <Button
                shape="square"
                size="sm"
                onClick={handleCopy}
                className='w-full'
              >
                <div className='flex flex-row items-center gap-2'>
                  {isCopied ? <CheckmarkIcon /> : <CopyIcon />}
                  <Text variant="normal" fontWeight="bold" color="text100">
                    Copy wallet address
                  </Text>
                </div>
              </Button>

              <Button
                shape="square"
                size="sm"
                className='w-full'
                onClick={() => setIsConfirmSignOutModalOpen(true)}
              >
                <div className='flex flex-row items-center gap-2'>
                  <SignoutIcon />
                  <Text variant="normal" fontWeight="bold" color="text100">
                    Sign out
                  </Text>
                </div>
              </Button>
            </Card>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      )}

      {isConfirmSignOutModalOpen && (
        <Modal size="sm" onClose={() => setIsConfirmSignOutModalOpen(false)}>
          <ConfirmSignOut
            handleSignOut={signOut => {
              if (signOut) {
                authStore.logout()
                navigate('/')
              }
              setIsConfirmSignOutModalOpen(false)
            }}
          />
        </Modal>
      )}
    </PopoverPrimitive.Root>
  )
}
