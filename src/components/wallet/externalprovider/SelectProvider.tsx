import { Button, Card, Text } from '@0xsequence/design-system'
import EthereumProvider from '@walletconnect/ethereum-provider'
import { useState } from 'react'

import { createProvider, getWalletConnectProviderDetail } from '~/utils/ethereumprovider'

import { EIP1193Provider, useSyncProviders } from '~/hooks/useSyncProviders'

import { useStore } from '~/stores'
import { WalletConnectSignClientStore } from '~/stores/WalletConnectSignClientStore'

import WalletConnectIcon from '~/assets/icons/wallet-connect.svg'
import WarningIcon from '~/assets/icons/warning.svg'

export interface ProviderInfo {
  walletId?: string // Unique identifier for the wallet e.g io.metamask, io.metamask.flask
  uuid?: string // Globally unique ID to differentiate between provider sessions for the lifetime of the page
  name: string // Human-readable name of the wallet
  icon: string // URL to the wallet's icon
}

export interface ProviderDetail {
  info: ProviderInfo
  provider: EIP1193Provider | EthereumProvider
}

export default function SelectProvider({
  onSelectProvider
}: {
  onSelectProvider: (provider?: ProviderDetail) => void
}) {
  const walletConnectSignClientStore = useStore(WalletConnectSignClientStore)
  const providers = useSyncProviders()

  const [isConfirmingWalletConnect, setIsConfirmingWalletConnect] = useState(false)

  const walletConnectDappsConnected = walletConnectSignClientStore.allSessions.get().length > 0

  const handleConnectWalletConnect = async () => {
    await walletConnectSignClientStore.disconnectAllSessions()

    onSelectProvider()

    const walletConnectProvider = await createProvider(true)
    await walletConnectProvider.connect()

    onSelectProvider(getWalletConnectProviderDetail(walletConnectProvider))
  }

  return (
    <div>
      {isConfirmingWalletConnect ? (
        <div className='flex flex-col p-6 gap-6'>
          <Text variant="large" fontWeight="bold" color="text80">
            Use WalletConnect for External Wallet?
          </Text>
          <Card className='flex flex-col items-center gap-3' style={{ background: 'rgba(176, 126, 30, 0.3)' }}>
            <div className='flex flex-col gap-2'>
              <Text variant="medium" fontWeight="bold" color="text100">
                Attention
              </Text>
              {walletConnectDappsConnected ? (
                <Text variant="normal" fontWeight="medium" color="text80">
                  If you connect your external wallet using WalletConnect, you'll lose all Dapps connections
                  you already made using WalletConnect.
                </Text>
              ) : (
                <Text variant="normal" fontWeight="medium" color="text80">
                  If you connect your external wallet using WalletConnect, you won't be able to connect to any
                  other Dapps during this session. <br /> <br />
                  If you need to connect Dapps, please consider using a different external wallet instead.
                </Text>
              )}
            </div>
            <img src={WarningIcon} alt="Warning" className='w-5 h-auto' />
          </Card>
          <div className='flex flex-row gap-2 w-full mt-6'>
            <Button size="md" shape="square" onClick={() => onSelectProvider()}>
              Cancel
            </Button>

            <Button
              variant="primary"
              shape="square"
              onClick={() => handleConnectWalletConnect()}
            >
              Confirm
            </Button>
          </div>
        </div>
      ) : (
        <div className='flex flex-col p-6 gap-6'>
          <Text variant="large" fontWeight="bold" color="text80">
            Connect external wallet
          </Text>
          <Text variant="normal" fontWeight="medium" color="text50">
            You need an external wallet to relay transactions
          </Text>
          <div className='flex flex-col gap-3'>
            <Button
              className='flex flex-row gap-2 cursor-pointer'
              shape="square"
              onClick={() => {
                setIsConfirmingWalletConnect(true)
              }}
            >
              <div className='flex flex-row items-center gap-2'>
                <img src={WalletConnectIcon} alt="Wallet Connect" className='w-5 h-auto' />
                <Text variant="normal" fontWeight="bold" color="text100">
                  {'Wallet Connect'}
                </Text>
              </div>
            </Button>

            {providers.map(provider => (
              <Button
                key={provider.info.uuid}
                variant="secondary"
                shape="square"
                className='flex flex-row gap-2 cursor-pointer'
                onClick={() => onSelectProvider(provider)}
              >
                <div className='flex flex-row items-center gap-2'>
                  <img src={provider.info.icon} className='w-5 h-auto' />
                  <Text variant="normal" fontWeight="bold" color="text100">
                    {provider.info.name}
                  </Text>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
