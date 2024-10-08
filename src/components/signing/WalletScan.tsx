import { Box, Button, TextInput } from '@0xsequence/design-system'
import { Scanner } from '@yudiel/react-qr-scanner'
import { ChangeEvent, useState } from 'react'

import { useStore } from '~/stores'
import { WalletConnectSignClientStore } from '~/stores/WalletConnectSignClientStore'

export default function WalletScan({ onQrUri }: { onQrUri: () => void }) {
  const walletConnectSignClientStore = useStore(WalletConnectSignClientStore)
  const [signClientUri, setSignClientUri] = useState<string>('')

  const handleSignClientUri = () => {
    if (signClientUri) {
      console.log(signClientUri)

      walletConnectSignClientStore.pair(signClientUri)
    }
    onQrUri()
  }

  return (
    <Box flexDirection="column" justifyContent="space-between" padding="12" gap="3">
      <Scanner
        onScan={result => {
          if (!!result[0].rawValue) {
            setSignClientUri(result[0].rawValue)
          }
        }}
        styles={{
          video: {
            transform: 'scaleX(-1)',
            borderRadius: '10px'
          }
        }}
      />
      <Box>
        <TextInput
          label="Paste Connection String"
          labelLocation="top"
          name="signClientUri"
          value={signClientUri ?? ''}
          onChange={(ev: ChangeEvent<HTMLInputElement>) => {
            setSignClientUri(ev.target.value)
          }}
        />
        <Box justifyContent="flex-end">
          <Button
            marginTop="4"
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
    </Box>
  )
}
