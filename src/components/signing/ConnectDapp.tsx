import {
  Box,
  Button,
  Card,
  Divider,
  ExternalLinkIcon,
  IconButton,
  Text,
  useMediaQuery,
  useToast
} from '@0xsequence/design-system'
import { useState } from 'react'

import { getNetworkTitle } from '~/utils/network'

import { useObservable, useStore } from '~/stores'
import { WalletStore } from '~/stores/WalletStore'

export default function ConnectDapp({ onClose }: { onClose: () => void }) {
  const isMobile = useMediaQuery('isMobile')

  const walletStore = useStore(WalletStore)
  const connectOptions = useObservable(walletStore.connectOptions)

  const toast = useToast()

  const [isPending, setPending] = useState(false)

  const handleConnect = async () => {
    if (isPending) {
      return
    }
    setPending(true)

    const connectDetails = await walletStore.walletRequestHandler.connect(connectOptions)
    walletStore.connectDetails.set(connectDetails)

    setPending(false)

    toast({
      variant: 'success',
      title: 'Dapp connection added successfully',
      description: 'You can now receive dapp action requests.'
    })

    onClose()
  }

  const handleCancel = () => {
    // decline the connect request
    walletStore.connectDetails.set({ connected: false })
    onClose()
  }
  return (
    <Box style={{ minWidth: isMobile ? '100vw' : '500px' }}>
      <Box flexDirection="column" gap="6" padding="6">
        <Text variant="large" fontWeight="bold" color="text80">
          Would you like to connect to this dapp?
        </Text>

        <Box flexDirection="column" gap="3">
          <Card flexDirection="row" justifyContent="space-between" alignItems="center">
            <Text variant="normal" fontWeight="medium" color="text100">
              Origin
            </Text>
            <Box flexDirection="row" alignItems="center" gap="2">
              <Text variant="normal" fontWeight="medium" color="text100">
                {connectOptions?.origin?.split('//')[1]}
              </Text>
              <IconButton
                size="xs"
                icon={ExternalLinkIcon}
                onClick={() => window.open(connectOptions?.origin, '_blank')}
                style={{ width: '24px', height: '24px' }}
              />
            </Box>
          </Card>
          <Card flexDirection="row" justifyContent="space-between">
            <Text variant="normal" fontWeight="medium" color="text100">
              Network
            </Text>
            <Text variant="normal" fontWeight="medium" color="text100">
              {getNetworkTitle(Number(connectOptions?.networkId))}
            </Text>
          </Card>
        </Box>
      </Box>

      <Divider marginY="0" />

      <Box alignItems="center" justifyContent="flex-end" padding="6" gap="2">
        <Button label="Cancel" size="md" shape="square" onClick={() => handleCancel()} />

        <Button
          label={isPending ? `Authorizing…` : `Connect`}
          variant="primary"
          size="md"
          shape="square"
          disabled={isPending}
          onClick={() => handleConnect()}
        />
      </Box>
    </Box>
  )
}
