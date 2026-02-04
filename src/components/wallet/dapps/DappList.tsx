import {
  AddIcon,
  Button,
  Card,
  Modal,
  Text,
} from '@0xsequence/design-system'
import { useObservable } from 'micro-observables'
import { useState } from 'react'

import { useStore } from '~/stores'
import { WalletConnectSignClientStore } from '~/stores/WalletConnectSignClientStore'
import { WalletStore } from '~/stores/WalletStore'

import ConnectDapp from '~/components/signing/ConnectDapp'
import ConnectionList from '~/components/signing/ConnectionList'
import WalletScan from '~/components/signing/WalletScan'

import LinkConnectionIcon from '../../../assets/icons/link-connection.svg'
import WarningIcon from '../../../assets/icons/warning.svg'

export default function DappList() {
  const walletStore = useStore(WalletStore)

  const walletConnectSignClientStore = useStore(WalletConnectSignClientStore)

  const sessionList = useObservable(walletConnectSignClientStore.allSessions)

  const [isScanningQrWalletConnect, setIsScanningQrWalletConnect] = useState(false)
  const [isConnectingDapp, setIsConnectingDapp] = useState(false)

  const provider = useObservable(walletStore.selectedExternalProvider)

  const handleOnQrUri = async () => {
    setIsConnectingDapp(true)
  }

  return (
    <div className='flex flex-col'>
      <div className='flex flex-row justify-between items-center gap-2'>
        <div className='flex flex-row items-center gap-2'>
          <img src={LinkConnectionIcon} alt="Link Connection" />

          <Text variant="normal" fontWeight="bold" color="text100">
            Connected Dapps
          </Text>
        </div>

        <Button
          size="sm"
          shape="square"
          disabled={provider?.info.name === 'WalletConnect'}
          onClick={() => setIsScanningQrWalletConnect(true)}
        >
          <AddIcon />
          Connect
        </Button>
      </div>

      <div className='h-0 my-2' />

      {sessionList.length > 0 ? (
        <ConnectionList sessionList={sessionList}></ConnectionList>
      ) : (
        <Card className='flex flex-col'>
          {provider?.info.name === 'WalletConnect' ? (
            <div className='flex flex-col items-center gap-4'>
              <img src={WarningIcon} alt="Warning" />
              <Text variant="normal" color="text50" className='p-4'>
                To connect to Dapps, switch from WalletConnect to a different wallet as your External Wallet
                connection method.
              </Text>
            </div>
          ) : (
            <Text variant="normal" color="text50" className='p-4'>
              Connect a Dapp with WalletConnect to sign actions
            </Text>
          )}
        </Card>
      )}

      {isScanningQrWalletConnect && (
        <Modal
          contentProps={{
            className: 'w-full max-w-[500px] !w-[calc(100vw)] sm:!w-[500px]',
            style: { height: '572px' }
          }}
          rootProps={{ className: 'px-3 sm:px-0' }}
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
        <Modal size="sm" onClose={() => setIsConnectingDapp(false)}>
          <ConnectDapp onClose={() => setIsConnectingDapp(false)} />
        </Modal>
      )}
    </div>
  )
}
