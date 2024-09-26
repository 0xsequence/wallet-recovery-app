import { AccountSignerOptions } from '@0xsequence/account/dist/declarations/src/signer'
import { commons } from '@0xsequence/core'
import { Box, Button, Divider, Text } from '@0xsequence/design-system'
import { ConnectOptions, MessageToSign } from '@0xsequence/provider'

import { useStore } from '~/stores'
import { WalletStore } from '~/stores/WalletStore'

export default function SignRequest({
  onClose,
  isTxn
}: {
  onClose: (
    details?: commons.transaction.Transactionish | MessageToSign | undefined,
    chainId?: number,
    options?: ConnectOptions | AccountSignerOptions
  ) => void
  isTxn: boolean
}) {
  const walletStore = useStore(WalletStore)

  const details = isTxn
    ? (walletStore.toSignTxnDetails.get() as any)
    : (walletStore.toSignMsgDetails.get() as any)

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
          <Button
            width="full"
            label={`Cancel`}
            onClick={() => {
              onClose()
            }}
            data-id="signingCancel"
          />

          <Button
            width="full"
            variant="primary"
            label={'Send'}
            onClick={() => {
              onClose(details, details.chainId, details.connectOptions)
            }}
            data-id="signingContinue"
          />
        </Box>
      </Box>
    </Box>
  )
}
