import { Box, Button, Divider, Text } from '@0xsequence/design-system'
import { useState } from 'react'

import { useStore } from '~/stores'
import { WalletStore } from '~/stores/WalletStore'

export default function SignTransaction({ onClose }: { onClose: () => void }) {
  const walletStore = useStore(WalletStore)

  const [isPending, setPending] = useState(false)

  const handleSend = async () => {
    try {
      setPending(true)
      const details = walletStore.toSignTxnDetails.get()
      if (!details) {
        walletStore.toSignTxnPermission.set('cancelled')
      } else {
        const result = await walletStore.signTransaction(details.txn, details.chainId, details.options)
        walletStore.toSignTxnPermission.set('approved')
        walletStore.toSignTxnResult.set(result)
      }
      setPending(false)
      onClose()
    } catch (error) {
      setPending(false)
      walletStore.toSignTxnPermission.set('cancelled')
      onClose()
      throw error
    }
  }

  const handleCancel = () => {
    setPending(false)
    walletStore.toSignTxnPermission.set('cancelled')
    onClose()
  }
  return (
    <Box>
      <Box flexDirection="column" padding="10" alignItems="center">
        <Text variant="md" fontWeight="bold" color="text100" paddingX="16" paddingBottom="1">
          Would you like to approve this transaction?
        </Text>
        <Divider color="gradientPrimary" width="full" height="px" />
        <Text variant="md" color="text100" paddingY="5" paddingBottom="1">
          TRANSACTION_INFO_HERE
        </Text>
        <Box flexDirection={{ sm: 'column', md: 'row' }} gap="2" width="full" marginTop="10">
          <Button width="full" label={`Cancel`} onClick={handleCancel} data-id="signingCancel" />

          <Button
            width="full"
            variant="primary"
            label={'Send'}
            disabled={isPending}
            // disabled={isPending || canValidateOnchain === undefined}
            onClick={handleSend}
            data-id="signingContinue"
          />
        </Box>
      </Box>
    </Box>
  )
}
