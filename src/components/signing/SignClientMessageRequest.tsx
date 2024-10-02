import { AccountSignerOptions } from '@0xsequence/account/dist/declarations/src/signer'
import { Box, Button, Divider, Text } from '@0xsequence/design-system'
import { MessageToSign } from '@0xsequence/provider'

import { useStore } from '~/stores'
import { WalletStore } from '~/stores/WalletStore'

export default function SignClientMessageRequest({
  onClose
}: {
  onClose: (details?: { message: MessageToSign; chainId: number; options?: AccountSignerOptions }) => void
}) {
  const walletStore = useStore(WalletStore)

  const details = walletStore.toSignMsgDetails.get()

  return (
    <Box>
      <Box flexDirection="column" padding="10" alignItems="center">
        <Text variant="md" fontWeight="bold" color="text100" paddingX="16" paddingBottom="1">
          {'Would you like to sign this message?'}
        </Text>
        <Divider color="gradientPrimary" width="full" height="px" />
        <Text variant="md" color="text100" paddingY="3" paddingBottom="1">
          {'MESSAGE_INFO_HERE'}
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
              onClose(details)
            }}
            data-id="signingContinue"
          />
        </Box>
      </Box>
    </Box>
  )
}
