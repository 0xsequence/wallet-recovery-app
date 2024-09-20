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

export default function SignClientMessageRequest({
  onClose
}: {
  onClose: (details?: { message: MessageToSign; chainId: number; options?: ConnectOptions }) => void
}) {
  const walletStore = useStore(WalletStore)
  const authStore = useStore(AuthStore)

  const details = walletStore.toSignMsgDetails.get()
  const accountAddress = authStore.accountAddress.get()

  const [signingMessage, setSigningMessage] = useState<string>('')
  const [timestamp, setTimestamp] = useState<string>('')

  useEffect(() => {
    console.log('details', details)
    // TODO maybe set timestamp state in store or other persistent state
    setTimestamp(new Date().toLocaleString())
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
        <Box flexDirection="column" padding="10" alignItems="center" gap="4">
          <Text variant="md" fontWeight="bold" color="text100">
            Would you like to sign this message?
          </Text>
          <Divider color="gradientPrimary" width="full" height="px" />
          <Card flexDirection="row" justifyContent="space-between">
            <Text variant="md" color="text100">
              Requested at
            </Text>
            <Text variant="md" color="text100">
              {timestamp}
            </Text>
          </Card>
          <Card flexDirection="row" justifyContent="space-between" alignItems="center">
            <Text variant="md" color="text100">
              Origin
            </Text>
            <Box alignItems="center" gap="3">
              <Text variant="md" color="text100">
                {details?.options?.origin?.split('//')[1]}
              </Text>
              <IconButton
                size="xs"
                icon={ExternalLinkIcon}
                onClick={() => window.open(details.options?.origin, '_blank')}
              />
            </Box>
          </Card>
          <Card flexDirection="row" justifyContent="space-between">
            <Text variant="md" color="text100">
              Network
            </Text>
            <Text variant="md" color="text100">
              {`${getNetworkTitle(details.chainId)}`}
            </Text>
          </Card>
          <Card flexDirection="column" gap="4">
            <Text variant="md" color="text100">
              Signee
            </Text>
            <Card>
              <Text variant="md" color="text100">
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
      )}
    </Box>
  )
}
