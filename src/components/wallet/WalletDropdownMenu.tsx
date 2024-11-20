import {
  Box,
  Button,
  Card,
  CopyIcon,
  GradientAvatar,
  Modal,
  SignoutIcon,
  Text
} from '@0xsequence/design-system'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { truncateMiddle } from '~/utils/truncatemiddle'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'

export default function SettingsDropdownMenu() {
  const authStore = useStore(AuthStore)

  const walletAddress = useObservable(authStore.accountAddress)

  const [isOpen, toggleOpen] = useState(false)
  const [isConfirmSignOutModalOpen, setIsConfirmSignOutModalOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={toggleOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          label={
            <Box flexDirection="row" alignItems="center" gap="2">
              <GradientAvatar address={walletAddress} size="sm" />
              <Text variant="normal" fontWeight="bold" color="text100">
                {truncateMiddle(walletAddress!, 4, 4)}
              </Text>
            </Box>
          }
          variant="text"
        />
      </PopoverPrimitive.Trigger>

      {isOpen && (
        <PopoverPrimitive.Portal forceMount>
          <PopoverPrimitive.Content asChild side="bottom" sideOffset={8} align="center">
            <Card flexDirection="column" backdropFilter="blur" gap="2">
              <Button
                leftIcon={CopyIcon}
                label="Copy wallet address"
                shape="square"
                size="sm"
                width="full"
                onClick={() => navigator.clipboard.writeText(walletAddress!)}
              />
              <Button
                leftIcon={SignoutIcon}
                label="Sign out"
                shape="square"
                size="sm"
                width="full"
                onClick={() => setIsConfirmSignOutModalOpen(true)}
              />
            </Card>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      )}

      {isConfirmSignOutModalOpen && (
        <Modal size="sm" onClose={() => setIsConfirmSignOutModalOpen(false)}>
          <Box flexDirection="column" padding="8">
            <Text variant="medium" color="text80" marginRight="8">
              You will need to re-enter your mnemonic if you sign out. Continue?
            </Text>
            <Box flexDirection="row" width="full" justifyContent="flex-end" marginTop="8" gap="4">
              <Button
                label="Sign Out"
                shape="square"
                variant="primary"
                onClick={() => {
                  authStore.logout()
                  navigate('/')
                }}
              />
              <Button label="Cancel" shape="square" onClick={() => setIsConfirmSignOutModalOpen(false)} />
            </Box>
          </Box>
        </Modal>
      )}
    </PopoverPrimitive.Root>
  )
}
