import { Box, Card, Text } from '@0xsequence/design-system'
import EthereumProvider from '@walletconnect/ethereum-provider'
import { useState } from 'react'

import { createProvider, getWalletConnectProviderDetail } from '~/utils/ethereumprovider'

import { EIP1193Provider, useSyncProviders } from '~/hooks/useSyncProviders'

import { useStore } from '~/stores'
import { WalletConnectSignClientStore } from '~/stores/WalletConnectSignClientStore'

import WalletConnectIcon from '~/assets/icons/wallet-connect.svg'

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

  const [isWalletConnectModalOpen, setIsWalletConnectModalOpen] = useState(false)

  const confirmWalletConnectModalOpen = (): boolean => {
    const confirmed = window.confirm(
      'All WalletConnect Dapp sessions will be disconnected. If you would like to continue, click OK and connect to WalletConnect again.'
    )
    return confirmed
  }

  const handleWalletConnectModalOpen = async () => {
    try {
      if (!isWalletConnectModalOpen) {
        if (walletConnectSignClientStore.allSessions.get().length !== 0) {
          const confirmed = confirmWalletConnectModalOpen()
          if (!confirmed) {
            throw new Error('User rejected wallet connect modal')
          }
          await walletConnectSignClientStore.disconnectAllSessions()
          onSelectProvider()
          return
        }

        setIsWalletConnectModalOpen(true)
        onSelectProvider()

        const walletConnectProvider = await createProvider(true)
        await walletConnectProvider.connect()

        let walletConnectProviderDetail = getWalletConnectProviderDetail(walletConnectProvider)

        onSelectProvider(walletConnectProviderDetail)
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Box flexDirection="column" padding="6" gap="6">
      <Text variant="large" color="text100">
        Connect external wallet
      </Text>
      <Text variant="normal" color="text50">
        You need an external wallet to relay transactions
      </Text>
      <Box flexDirection="column" gap="3">
        <Card
          flexDirection="row"
          justifyContent="center"
          gap="2"
          cursor="pointer"
          borderRadius="circle"
          background={{ base: 'buttonGlass', hover: 'backgroundSecondary' }}
          onClick={() => {
            handleWalletConnectModalOpen()
          }}
        >
          <Box flexDirection="row" alignItems="center" gap="2">
            <img src={WalletConnectIcon} alt={'Wallet Connect'} height={20} width={20} />
            <Text variant="normal" fontWeight="bold" color="text100">
              {'Wallet Connect'}
            </Text>
          </Box>
        </Card>

        {providers.map(provider => (
          <Card
            key={provider.info.uuid}
            flexDirection="row"
            justifyContent="center"
            gap="2"
            cursor="pointer"
            borderRadius="circle"
            background={{ base: 'buttonGlass', hover: 'backgroundSecondary' }}
            onClick={() => onSelectProvider(provider)}
          >
            <Box flexDirection="row" alignItems="center" gap="2">
              <img src={provider.info.icon} alt={provider.info.name} height={20} width={20} />
              <Text variant="normal" fontWeight="bold" color="text100">
                {provider.info.name}
              </Text>
            </Box>
          </Card>
        ))}
      </Box>
    </Box>
  )
}
