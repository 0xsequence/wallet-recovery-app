import { Box, Button, Card, Divider, ExternalLinkIcon, IconButton, Text } from '@0xsequence/design-system'
import { useState } from 'react'

import { getNetworkTitle } from '~/utils/network'

import { useObservable, useStore } from '~/stores'
import { WalletStore } from '~/stores/WalletStore'

export default function ConnectDapp({ onClose }: { onClose: () => void }) {
  const walletStore = useStore(WalletStore)
  const connectOptions = useObservable(walletStore.connectOptions)

  const [isPending, setPending] = useState(false)

  const handleConnect = async () => {
    if (isPending) {
      return
    }
    setPending(true)

    if (connectOptions?.networkId === undefined) {
      throw new Error('no network in connect options')
    }
    const chainId = connectOptions.networkId
    if (chainId === undefined) {
      throw new Error(`no network ${connectOptions.networkId} found`)
    }

    const connectDetails = await walletStore.walletRequestHandler.connect(connectOptions)
    console.log('connectDetails:', connectDetails)
    walletStore.connectDetails.set(connectDetails)

    setPending(false)
    onClose()
  }

  const handleCancel = () => {
    // decline the connect request
    walletStore.connectDetails.set({ connected: false })
    onClose()
  }
  return (
    <Box>
      {connectOptions && (
        <Box flexDirection="column" padding="10" alignItems="center" gap="4">
          <Text variant="md" fontWeight="bold" color="text100" paddingX="16" paddingBottom="1">
            Would you like to allow this dapp to connect to your wallet?
          </Text>
          <Divider color="gradientPrimary" width="full" height="px" />
          <Card flexDirection="row" justifyContent="space-between" alignItems="center">
            <Text variant="md" color="text100">
              {connectOptions.app}
            </Text>
            <Box flexDirection="row" alignItems="center" gap="3">
              <Text variant="md" color="text100">
                {connectOptions.origin?.split('//')[1]}
              </Text>
              <IconButton
                size="xs"
                icon={ExternalLinkIcon}
                onClick={() => window.open(connectOptions.origin, '_blank')}
              />
            </Box>
          </Card>
          <Card flexDirection="row" justifyContent="space-between">
            <Text variant="md" color="text100">
              {`Network`}
            </Text>
            <Text variant="md" color="text100">
              {`${getNetworkTitle(Number(connectOptions.networkId))}`}
            </Text>
          </Card>
          <Box flexDirection={{ sm: 'column', md: 'row' }} gap="2" width="full" marginTop="6">
            <Button width="full" label={`Cancel`} onClick={handleCancel} data-id="signingCancel" />

            <Button
              width="full"
              variant="primary"
              label={isPending ? `Authorizing…` : `Connect`}
              disabled={isPending}
              // disabled={isPending || canValidateOnchain === undefined}
              onClick={handleConnect}
              data-id="signingContinue"
            />
          </Box>
        </Box>
      )}
    </Box>
  )
}
