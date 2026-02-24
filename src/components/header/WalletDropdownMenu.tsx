import {
  Button,
  Card,
  CheckmarkIcon,
  CopyIcon,
  GradientAvatar,
  Modal,
  SignoutIcon,
  Text,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@0xsequence/design-system'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'

import ConfirmSignOut from '~/components/wallet/ConfirmSignOut'
import { truncateAddress } from '~/utils/truncateAddress'

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
    <Popover open={isOpen} onOpenChange={toggleOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 bg-transparent border-none cursor-pointer"
          onClick={() => {
            toggleOpen(true)
          }}
        >
          <div className='flex flex-row items-center gap-2'>
            <GradientAvatar address={walletAddress!} size="sm" />
            <Text variant="normal" fontWeight="bold" color="text100">
              {truncateAddress(walletAddress! as `0x${string}`, 4, 4)}
            </Text>
          </div>
        </button>
      </PopoverTrigger>



      {isOpen && (
        <PopoverContent asChild side="bottom" sideOffset={8} align="center">
          <div className='bg-background-raised rounded-xl'>
            <Card className='flex flex-col gap-2  rounded-xl'>
              <Button
                shape="square"
                size="sm"
                variant="secondary"
                onClick={handleCopy}
                className='w-full bg-background-raised hover:bg-background-raised/80 border-border-button hover:border-border-button/80 '
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
                className='w-full bg-background-raised hover:bg-background-raised/80 border-border-button hover:border-border-button/80 '
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
          </div>
        </PopoverContent>
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
    </Popover>
  )
}
