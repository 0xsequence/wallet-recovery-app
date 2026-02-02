import { Button, Text, TextInput, useMediaQuery } from '@0xsequence/design-system'
import { Scanner } from '@yudiel/react-qr-scanner'
import { ChangeEvent, useState } from 'react'

import { useStore } from '~/stores'
import { WalletConnectSignClientStore } from '~/stores/WalletConnectSignClientStore'

export default function WalletScan({ onQrUri }: { onQrUri: (isPaired: boolean) => void }) {
  const isMobile = useMediaQuery('isMobile')

  const walletConnectSignClientStore = useStore(WalletConnectSignClientStore)
  const [signClientUri, setSignClientUri] = useState<string>('')

  const handleSignClientUri = async () => {
    if (signClientUri) {
      console.log(signClientUri)
      try {
        await walletConnectSignClientStore.pair(signClientUri)
      } catch (error) {
        console.error('Error pairing with dapp', error)
        onQrUri(false)
        return
      }
    }
    onQrUri(true)
  }

  return (
    <div className='flex flex-col'>
      <div className='flex flex-col justify-between gap-6 p-6'>
        <Text variant="large" fontWeight="bold" color="text80">
          Connect a Dapp
        </Text>

        <div className='self-center' style={{ height: '280px', width: '280px' }}>
          <Scanner
            onScan={result => {
              if (result[0].rawValue) {
                setSignClientUri(result[0].rawValue)
              }
            }}
            styles={{
              video: {
                transform: isMobile ? 'scaleX(-1)' : 'scaleX(1)',
                borderRadius: '10px'
              }
            }}
          />
        </div>
        <div className='flex flex-col gap-1'>
          <Text variant="normal" fontWeight="medium" color="text80">
            Paste connection string
          </Text>

          <TextInput
            name="signClientUri"
            value={signClientUri}
            onChange={(ev: ChangeEvent<HTMLInputElement>) => setSignClientUri(ev.target.value)}
          />
        </div>
      </div>

      <div className='h-0 my-0' />

      <div className='flex flex-row justify-end gap-2 p-6'>
        <Button
          size="md"
          shape="square"
          onClick={() => {
            onQrUri(false)
          }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="md"
          shape="square"
          disabled={!signClientUri}
          onClick={() => {
            if (signClientUri) {
              handleSignClientUri()
            }
          }}
        >
          Connect Dapp
        </Button>
      </div>
    </div>
  )
}
