import { Button, Text, TextInput, useMediaQuery } from '@0xsequence/design-system'
import { Scanner } from '@yudiel/react-qr-scanner'
import { ChangeEvent, useEffect, useState } from 'react'

import { useStore } from '~/stores'
import { WalletConnectSignClientStore } from '~/stores/WalletConnectSignClientStore'

export default function WalletScan({ onQrUri }: { onQrUri: (isPaired: boolean) => void }) {
  const isMobile = useMediaQuery('isMobile')

  const walletConnectSignClientStore = useStore(WalletConnectSignClientStore)
  const [signClientUri, setSignClientUri] = useState<string>('')
  const [hasCamera, setHasCamera] = useState<boolean | null>(null)

  useEffect(() => {
    let isMounted = true

    const detectCamera = async () => {
      if (!navigator.mediaDevices?.enumerateDevices) {
        if (isMounted) setHasCamera(false)
        return
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const hasVideoInput = devices.some(device => device.kind === 'videoinput')
        if (isMounted) setHasCamera(hasVideoInput)
      } catch (error) {
        console.warn('Unable to enumerate media devices', error)
        if (isMounted) setHasCamera(false)
      }
    }

    detectCamera()

    return () => {
      isMounted = false
    }
  }, [])

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
    <div className='flex flex-col w-full min-w-0'>
      <div className='flex flex-col justify-between gap-6 p-3 sm:p-6 w-full min-w-0'>
        <Text variant="large" fontWeight="bold" color="text80">
          Connect a Dapp
        </Text>

        {hasCamera ? (
          <div className='self-center w-full max-w-[320px] aspect-square min-w-0'>
            <Scanner
              onScan={result => {
                if (result[0].rawValue) {
                  setSignClientUri(result[0].rawValue)
                }
              }}
              styles={{
                video: {
                  transform: isMobile ? 'scaleX(-1)' : 'scaleX(1)',
                  borderRadius: '10px',
                  width: '100%',
                  height: '100%'
                }
              }}
            />
          </div>
        ) : null}
        {hasCamera === false ? (
          <Text variant="normal" fontWeight="medium" color="text80">
            Camera not available on this device. Please paste the connection string below.
          </Text>
        ) : null}
        <div className='flex flex-col gap-1 w-full min-w-0'>
          <Text variant="normal" fontWeight="medium" color="text80">
            Paste connection string
          </Text>

          <TextInput
            name="signClientUri"
            value={signClientUri}
            onChange={(ev: ChangeEvent<HTMLInputElement>) => setSignClientUri(ev.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <div className='h-0 my-0' />

      <div className='flex flex-col-reverse sm:flex-row justify-end gap-2 p-3 sm:p-6 w-full min-w-0 pt-0!'>
        <Button
          size="md"
          shape="square"
          className="w-full sm:w-auto"
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
          className="w-full sm:w-auto"
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
