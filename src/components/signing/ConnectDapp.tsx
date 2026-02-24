import {
  Button,
  Card,
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
    <div className='min-w-[500px] w-full' style={{ minWidth: isMobile ? '100vw' : '500px' }}>
      <div className='flex flex-col gap-6 p-6'>
        <Text variant="large" fontWeight="bold" color="text80">
          Would you like to connect to this dapp?
        </Text>

        <div className='flex flex-col gap-3'>
          <Card className='flex flex-row justify-between items-center'>
            <Text variant="normal" fontWeight="medium" color="text100">
              Origin
            </Text>
            <div className='flex flex-row items-center gap-2'>
              <Text variant="normal" fontWeight="medium" color="text100">
                {connectOptions?.origin?.split('//')[1]}
              </Text>
              <IconButton
                size="xs"
                icon={ExternalLinkIcon}
                onClick={() => window.open(connectOptions?.origin, '_blank')}
              />
            </div>
          </Card>
          <Card className='flex flex-row justify-between'>
            <Text variant="normal" fontWeight="medium" color="text100">
              Network
            </Text>
            <Text variant="normal" fontWeight="medium" color="text100">
              {getNetworkTitle(Number(connectOptions?.networkId))}
            </Text>
          </Card>
        </div>
      </div>

      <div className='h-0 my-0' />

      <div className='flex flex-row items-center justify-end gap-2 p-6'>
        <Button size="md" shape="square" onClick={() => handleCancel()}>
          Cancel
        </Button>

        <Button
          variant="primary"
          size="md"
          shape="square"
          disabled={isPending}
          onClick={() => handleConnect()}
        >
          {isPending ? `Authorizing…` : `Connect`}
        </Button>
      </div>
    </div>
  )
}
