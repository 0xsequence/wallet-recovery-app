import { Box, Button, Divider, Text, TextInput, useMediaQuery } from '@0xsequence/design-system'
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
    <Box flexDirection="column">
      <Box flexDirection="column" justifyContent="space-between" padding="6" gap="6">
        <Text variant="large" fontWeight="bold" color="text80">
          Connect a Dapp
        </Text>

        <Box alignSelf="center" style={{ height: '280px', width: '280px' }}>
          <Scanner
            onScan={result => {
              if (!!result[0].rawValue) {
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
        </Box>
        <Box flexDirection="column" gap="1">
          <Text variant="normal" fontWeight="medium" color="text80">
            Paste connection string
          </Text>

          <TextInput
            name="signClientUri"
            value={signClientUri}
            onChange={(ev: ChangeEvent<HTMLInputElement>) => setSignClientUri(ev.target.value)}
          />
        </Box>
      </Box>

      <Divider marginY="0" />

      <Box justifyContent="flex-end" padding="6" gap="2">
        <Button
          size="md"
          shape="square"
          label="Cancel"
          onClick={() => {
            onQrUri(false)
          }}
        />
        <Button
          variant="primary"
          size="md"
          shape="square"
          label="Connect Dapp"
          disabled={!signClientUri}
          onClick={() => {
            if (signClientUri) {
              handleSignClientUri()
            }
          }}
        />
      </Box>
    </Box>
  )
}
