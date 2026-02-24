import {
  Button,
  Card,
  Collapsible,
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
    <div>
      {details && (
        <>
          <div className='flex flex-col gap-6 p-6'>
            <Text variant="large" fontWeight="bold" color="text100">
              Would you like to approve this transaction?
            </Text>

            <div className='flex flex-col gap-3'>
              <Card className='flex flex-row justify-between items-center'>
                <Text variant="normal" fontWeight="medium" color="text100">
                  Origin
                </Text>
                <div className='flex flex-row items-center gap-2'>
                  <Text variant="normal" fontWeight="medium" color="text100">
                    {details?.origin?.split('//')[1]}
                  </Text>
                  <IconButton
                    size="xs"
                    icon={ExternalLinkIcon}
                    onClick={() => window.open(details?.origin, '_blank')}
                    style={{ width: '24px', height: '24px' }}
                  />
                </div>
              </Card>
              <Card className='flex flex-row justify-between'>
                <Text variant="normal" fontWeight="medium" color="text100">
                  Network
                </Text>
                <Text variant="normal" fontWeight="medium" color="text100">
                  {getNetworkTitle(Number(details.chainId))}
                </Text>
              </Card>
              <Card className='flex flex-col gap-4'>
                <Text variant="normal" fontWeight="medium" color="text100">
                  Signee
                </Text>
                <Card>
                  <Text
                    variant="normal"
                    fontWeight="medium"
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
            </div>
          </div>
          <div className='h-0 my-0' />

          <div className='flex flex-row items-center justify-end gap-2 p-6'>
            <Button
              size="md"
              shape="square"
              onClick={() => {
                onClose()
              }}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              size="md"
              shape="square"
              onClick={() => onClose(details)}
            >
              Send
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
