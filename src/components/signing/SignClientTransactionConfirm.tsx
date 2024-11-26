import {
  Box,
  Button,
  Card,
  Collapsible,
  Divider,
  ExternalLinkIcon,
  IconButton,
  Text
} from '@0xsequence/design-system'
import { ConnectOptions, MessageToSign, trimEIP191Prefix } from '@0xsequence/provider'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'

import { getNetworkTitle } from '~/utils/network'

import { useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'
import { WalletStore } from '~/stores/WalletStore'

export default function SignClientTransactionConfirm({
  onClose
}: {
  onClose: (details?: { message: MessageToSign; chainId: number; options?: ConnectOptions }) => void
}) {
  const walletStore = useStore(WalletStore)
  const authStore = useStore(AuthStore)

  const details = walletStore.toSignMsgDetails.get()
  const accountAddress = authStore.accountAddress.get()

  const [signingMessage, setSigningMessage] = useState<string>('')

  useEffect(() => {
    if (details?.message.message) {
      const trimmedMessage = trimEIP191Prefix(details.message.message)
      try {
        setSigningMessage(ethers.toUtf8String(trimmedMessage))
      } catch {
        setSigningMessage(ethers.hexlify(trimmedMessage))
      }
    } else if (details?.message.typedData) {
      setSigningMessage(JSON.stringify(details.message.typedData, undefined, 4))
    }
  }, [details])

  return (
    <Box>
      {details && (
        <>
          <Box flexDirection="column" gap="6" padding="6">
            <Text variant="large" fontWeight="bold" color="text100">
              Would you like to approve this transaction?
            </Text>

            <Box flexDirection="column" gap="3">
              <Card flexDirection="row" justifyContent="space-between" alignItems="center">
                <Text variant="normal" fontWeight="semibold" color="text100">
                  Origin
                </Text>
                <Box flexDirection="row" alignItems="center" gap="2">
                  <Text variant="normal" fontWeight="semibold" color="text100">
                    {details.options?.origin?.split('//')[1]}
                  </Text>
                  <IconButton
                    size="xs"
                    icon={ExternalLinkIcon}
                    onClick={() => window.open(details.options?.origin, '_blank')}
                    style={{ width: '24px', height: '24px' }}
                  />
                </Box>
              </Card>
              <Card flexDirection="row" justifyContent="space-between">
                <Text variant="normal" fontWeight="semibold" color="text100">
                  Network
                </Text>
                <Text variant="normal" fontWeight="semibold" color="text100">
                  {getNetworkTitle(Number(details.chainId))}
                </Text>
              </Card>
              <Card flexDirection="column" gap="4">
                <Text variant="normal" fontWeight="semibold" color="text100">
                  Signee
                </Text>
                <Card>
                  <Text
                    variant="normal"
                    fontWeight="semibold"
                    color="text100"
                    style={{ fontFamily: 'monospace' }}
                  >
                    {`${accountAddress}`}
                  </Text>
                </Card>
              </Card>
              <Collapsible label={`Message Content`}>
                <Card>
                  <Text
                    variant="code"
                    color="text80"
                    style={{
                      overflowWrap: 'anywhere',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {signingMessage}
                  </Text>
                </Card>
              </Collapsible>
            </Box>
          </Box>
          <Divider marginY="0" />

          <Box alignItems="center" justifyContent="flex-end" padding="6" gap="2">
            <Button
              label="Cancel"
              size="md"
              shape="square"
              onClick={() => {
                onClose()
              }}
            />

            <Button
              label="Send"
              variant="primary"
              size="md"
              shape="square"
              onClick={() => onClose(details)}
            />
          </Box>
        </>
      )}
    </Box>
  )
}
