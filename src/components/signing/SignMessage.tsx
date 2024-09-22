import { Box, Button, Divider, Text } from '@0xsequence/design-system'
import { useState } from 'react'

import { useStore } from '~/stores'
import { WalletStore } from '~/stores/WalletStore'

// TODO: Merge this with SignTransaction.tsx
export default function SignMessage({ onClose }: { onClose: () => void }) {
  const walletStore = useStore(WalletStore)

  const [isPending, setPending] = useState(false)

  const handleSign = async () => {
    try {
      setPending(true)
      const details = walletStore.toSignMsgDetails.get()
      if (!details) {
        walletStore.toSignPermission.set('cancelled')
      } else {
        const result = await walletStore.signMessage(details.message, details.chainId, details.options)
        walletStore.toSignPermission.set('approved')
        walletStore.toSignResult.set(result)
      }
      setPending(false)
      onClose()
    } catch (error) {
      setPending(false)
      walletStore.toSignPermission.set('cancelled')
      onClose()
      throw error
    }
  }

  const handleCancel = () => {
    setPending(false)
    walletStore.toSignPermission.set('cancelled')
    onClose()
  }
  return (
    <Box>
      <Box flexDirection="column" padding="10" alignItems="center">
        <Text variant="md" fontWeight="bold" color="text100" paddingX="16" paddingBottom="1">
          Would you like to sign this message?
        </Text>
        <Divider color="gradientPrimary" width="full" height="px" />
        <Text variant="md" color="text100" paddingY="5" paddingBottom="1">
          MESSAGE_INFO_HERE
        </Text>
        <Box flexDirection={{ sm: 'column', md: 'row' }} gap="2" width="full" marginTop="10">
          <Button width="full" label={`Cancel`} onClick={handleCancel} data-id="signingCancel" />

          <Button
            width="full"
            variant="primary"
            label={'Send'}
            disabled={isPending}
            // disabled={isPending || canValidateOnchain === undefined}
            onClick={handleSign}
            data-id="signingContinue"
          />
        </Box>
      </Box>
    </Box>
  )
}
