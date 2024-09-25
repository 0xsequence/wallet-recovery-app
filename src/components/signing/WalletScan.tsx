import { Box, Button, TextInput } from '@0xsequence/design-system'
import { ChangeEvent, useState } from 'react'
import QrReader from 'react-qr-scanner'

import { useStore } from '~/stores'
import { WalletConnectSignClientStore } from '~/stores/WalletConnectSignClientStore'

export default function ScanWallet({ onQrUri }: { onQrUri: (uri: string) => void }) {
  const walletConnectSignClientStore = useStore(WalletConnectSignClientStore)
  const [signClientUri, setSignClientUri] = useState<string>('')

  const handleSignClientUri = () => {
    if (signClientUri) {
      walletConnectSignClientStore.pair(signClientUri)
    }
    onQrUri(signClientUri)
  }

  return (
    <Box
      flexDirection="column"
      justifyContent="space-between"
      padding="6"
      style={{ height: '625px', width: '600px' }}
    >
      <QrReader
        style={{ transform: 'scaleX(-1)', borderRadius: '10px' }}
        height="full"
        width="full"
      ></QrReader>
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
