import { AddIcon, Box, Button, Divider, Image, Modal, Text, useMediaQuery } from '@0xsequence/design-system'
import { useObservable } from 'micro-observables'
import { useState } from 'react'

import { useStore } from '~/stores'
import { WalletConnectSignClientStore } from '~/stores/WalletConnectSignClientStore'
import { WalletStore } from '~/stores/WalletStore'

import ConnectionList from '~/components/signing/ConnectionList'

import LinkConnectionIcon from '~/assets/icons/link-connection.svg'

import ConnectDapp from '../signing/ConnectDapp'
import WalletScan from '../signing/WalletScan'

export default function DappList() {
  const isMobile = useMediaQuery('isMobile')

  const walletStore = useStore(WalletStore)
  const walletConnectSignClientStore = useStore(WalletConnectSignClientStore)

  const sessionList = useObservable(walletConnectSignClientStore.allSessions)

  const [isScanningQrWalletConnect, setIsScanningQrWalletConnect] = useState(false)
  const [isConnectingDapp, setIsConnectingDapp] = useState(false)

  const handleConnectSignClient = async () => {
    if (walletStore.selectedExternalProvider.get()?.info.name === 'WalletConnect') {
      walletStore.signClientWarningType.set('isWalletConnect')
    } else {
      setIsScanningQrWalletConnect(true)
    }
  }

  const handleOnQrUri = async () => {
    setIsConnectingDapp(true)
  }

  return (
    <Box flexDirection="column">
      <Box justifyContent="space-between" alignItems="center" gap="2">
        <Box alignItems="center" gap="2">
          <Image src={LinkConnectionIcon} width="7" height="7" />

          <Text variant="large" fontWeight="bold" color="text100">
            Connected Dapps
          </Text>
        </Box>

        <Button
          size="sm"
          leftIcon={AddIcon}
          label="Connect"
          shape="square"
          onClick={() => handleConnectSignClient()}
        />
      </Box>

      <Divider marginY="2" />

      {sessionList.length > 0 ? (
        <ConnectionList sessionList={sessionList}></ConnectionList>
      ) : (
        <Text alignSelf="center" variant="large" color="text50" padding="4">
          Connect an external wallet to relay transactions
        </Text>
      )}

      {isScanningQrWalletConnect && (
        <Modal
          size="md"
          contentProps={{
            style: { width: !isMobile ? '500px' : '100%' }
          }}
          onClose={() => setIsScanningQrWalletConnect(false)}
        >
          <WalletScan
            onQrUri={isPaired => {
              if (isPaired) {
                handleOnQrUri()
              }
              setIsScanningQrWalletConnect(false)
            }}
          />
        </Modal>
      )}

      {isConnectingDapp && (
        <Modal size="md" onClose={() => setIsConnectingDapp(false)}>
          <ConnectDapp onClose={() => setIsConnectingDapp(false)} />
        </Modal>
      )}
    </Box>
  )
}
