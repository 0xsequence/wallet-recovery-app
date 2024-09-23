import { Box, Button, Divider, Text } from '@0xsequence/design-system'
import { useState } from 'react'

import { useStore } from '~/stores'
import { WalletConnectSignClientStore } from '~/stores/WalletConnectSignClientStore'
import { WalletStore } from '~/stores/WalletStore'

export default function SignRequest({ onClose, isTxn }: { onClose: () => void; isTxn: boolean }) {
  const walletStore = useStore(WalletStore)
  const walletConnectSignClientStore = useStore(WalletConnectSignClientStore)

  const [isPending, setPending] = useState(false)

  const cancelRequest = () => {
    walletStore.resetSignObservables()
    walletConnectSignClientStore.rejectRequest()
    walletStore.toSignPermission.set('cancelled')
  }

  const handleSign = async () => {
    try {
      setPending(true)

      let details: any

      if (isTxn) details = walletStore.toSignTxnDetails.get()
      else details = walletStore.toSignMsgDetails.get()

      if (!details) {
        cancelRequest()
      } else {
        const result = isTxn
          ? await walletStore.signTransaction(details.txn, details.chainId, details.options)
          : await walletStore.signMessage(details.message, details.chainId, details.options)
        walletStore.toSignResult.set(result)
        walletStore.toSignPermission.set('approved')
      }

      setPending(false)
      onClose()
    } catch (error) {
      setPending(false)
      cancelRequest()
      onClose()
      throw error
    }
  }

  const handleCancel = () => {
    setPending(false)
    cancelRequest()

    onClose()
  }
  return (
    <Box>
      <Box flexDirection="column" padding="10" alignItems="center">
        <Text variant="md" fontWeight="bold" color="text100" paddingX="16" paddingBottom="1">
          {isTxn ? 'Would you like to approve this transaction?' : 'Would you like to sign this message?'}
        </Text>
        <Divider color="gradientPrimary" width="full" height="px" />
        <Text variant="md" color="text100" paddingY="5" paddingBottom="1">
          {isTxn ? 'TRANSACTION_INFO_HERE' : 'MESSAGE_INFO_HERE'}
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
