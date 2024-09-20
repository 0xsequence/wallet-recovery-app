import { Box, Button, Divider, Text } from '@0xsequence/design-system'
import { useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { NetworkStore } from '~/stores/NetworkStore'
import { WalletStore } from '~/stores/WalletStore'

export default function ConnectDapp({ onClose }: { onClose: () => void }) {
  const walletStore = useStore(WalletStore)
  const networkStore = useStore(NetworkStore)
  const [isPending, setPending] = useState(false)
  const connectOptions = useObservable(walletStore.connectOptions)

  const handleConnect = async () => {
    if (isPending) {
      return
    }
    setPending(true)

    if (connectOptions?.networkId === undefined) {
      throw new Error('no network in connect options')
    }
    const chainId = networkStore.getChainIdByNetworkId(connectOptions.networkId)
    if (chainId === undefined) {
      throw new Error(`no network ${connectOptions.networkId} found`)
    }
    connectOptions.networkId = chainId

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
        <Box flexDirection="column" padding="10" alignItems="center">
          <Text variant="md" fontWeight="bold" color="text100" paddingX="16" paddingBottom="1">
            Would you like to allow this dapp to connect to your wallet?
          </Text>
          <Divider color="gradientPrimary" width="full" height="px" />
          <Text variant="md" color="text100" paddingY="5" paddingBottom="1">
            URL_HERE
          </Text>
          <Box flexDirection={{ sm: 'column', md: 'row' }} gap="2" width="full" marginTop="10">
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
