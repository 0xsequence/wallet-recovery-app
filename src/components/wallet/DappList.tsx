import {
  AddIcon,
  Box,
  Button,
  Card,
  Divider,
  Image,
  Modal,
  Text,
  useMediaQuery
} from '@0xsequence/design-system'
import { useObservable } from 'micro-observables'
import { useState } from 'react'

import { useStore } from '~/stores'
import { WalletConnectSignClientStore } from '~/stores/WalletConnectSignClientStore'
import { WalletStore } from '~/stores/WalletStore'

import ConnectDapp from '~/components/signing/ConnectDapp'
import ConnectionList from '~/components/signing/ConnectionList'
import WalletScan from '~/components/signing/WalletScan'

import LinkConnectionIcon from '~/assets/icons/link-connection.svg'
import WarningIcon from '~/assets/icons/warning.svg'

export default function DappList() {
  const walletStore = useStore(WalletStore)
  const isMobile = useMediaQuery('isMobile')

  const walletConnectSignClientStore = useStore(WalletConnectSignClientStore)

  const sessionList = useObservable(walletConnectSignClientStore.allSessions)

  const [isScanningQrWalletConnect, setIsScanningQrWalletConnect] = useState(false)
  const [isConnectingDapp, setIsConnectingDapp] = useState(false)

  const provider = useObservable(walletStore.selectedExternalProvider)

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
          disabled={provider?.info.name === 'WalletConnect'}
          onClick={() => setIsScanningQrWalletConnect(true)}
        />
      </Box>

      <Divider marginY="2" />

      {sessionList.length > 0 ? (
        <ConnectionList sessionList={sessionList}></ConnectionList>
      ) : (
        <Card flexDirection="column">
          {provider?.info.name === 'WalletConnect' ? (
            <Box flexDirection="column" alignItems="center" gap="4">
              <Image src={WarningIcon} color="text50" width="8" height="8" />
              <Text textAlign="center" variant="large" color="text50" padding="4">
                To connect to Dapps, switch from WalletConnect to a different wallet as your External Wallet
                connection method.
              </Text>
            </Box>
          ) : (
            <Text alignSelf="center" textAlign="center" variant="large" color="text50" padding="4">
              Connect a Dapp with WalletConnect to sign actions
            </Text>
          )}
        </Card>
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
