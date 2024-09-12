import { Box, Card, Divider, Text } from '@0xsequence/design-system'
import EthereumProvider from '@walletconnect/ethereum-provider'
import { useMemo, useState } from 'react'

import { LocalStorageKey } from '~/constants/storage'

import { EIP1193Provider, EIP6963ProviderDetail, useSyncProviders } from '~/hooks/useSyncProviders'

import { useObservable, useStore } from '~/stores'
import { LocalStore } from '~/stores/LocalStore'
import { NetworkStore } from '~/stores/NetworkStore'
import { WalletStore } from '~/stores/WalletStore'

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

export const walletConnectProvider = await EthereumProvider.init({
  projectId: '95777495732e7317ec3fd92b88a1b19c',
  // metadata: {
  //   name: 'My Website',
  //   description: 'My Website Description',
  //   url: 'https://mywebsite.com', // origin must match your domain & subdomain
  //   icons: ['https://avatars.githubusercontent.com/u/37784886']
  // },
  showQrModal: true,
  optionalChains: [1, 137]
})

export default function SelectProvider({
  onSelectProvider
}: {
  onSelectProvider: (provider: ProviderDetail) => void
}) {
  const providers = useSyncProviders()

  const walletStore = useStore(WalletStore)

  const networkStore = useStore(NetworkStore)
  const networks = useObservable(networkStore.networks)
  const walletConnectChains = useMemo(() => networks.map(network => Number(network.chainId)), [networks])

  const [isWalletConnectModalOpen, setIsWalletConnectModalOpen] = useState(false)

  const handleWalletConnectModalOpen = async () => {
    try {
      setIsWalletConnectModalOpen(true)
      if (!isWalletConnectModalOpen) {
        await walletConnectProvider.connect({ optionalChains: walletConnectChains })
        let walletConnectProviderDetail = {
          info: {
            walletId: undefined,
            uuid: 'wallet-connect',
            name: 'WalletConnect',
            icon: 'https://avatars.githubusercontent.com/u/37784886'
          },
          provider: walletConnectProvider
        }

        let existingProviders = walletStore.availableExternalProviders.get()
        walletStore.availableExternalProviders.set([...existingProviders, walletConnectProviderDetail])

        onSelectProvider(walletConnectProviderDetail)
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <>
      {!isWalletConnectModalOpen && (
        <Box flexDirection="column" paddingY="5" alignItems="center">
          <Text variant="md" fontWeight="bold" color="text100" paddingX="16" paddingBottom="1">
            Select an external wallet to send transactions
          </Text>
          <Divider color="gradientPrimary" width="full" height="px" />
          <Box flexDirection="column" gap="4" padding="8">
            <Card
              flexDirection="row"
              alignItems="center"
              gap="2"
              cursor="pointer"
              background={{ base: 'buttonGlass', hover: 'backgroundSecondary' }}
              onClick={() => {
                handleWalletConnectModalOpen()
              }}
            >
              <Box flexDirection="row" alignItems="center" gap="2">
                <img
                  src={'https://avatars.githubusercontent.com/u/37784886'}
                  alt={'Wallet Connect'}
                  style={{ width: '20px', height: '20px' }}
                />
                <Text variant="normal" color="text100">
                  {'Wallet Connect'}
                </Text>
              </Box>
            </Card>

            {providers.map(provider => (
              <Card
                key={provider.info.uuid}
                flexDirection="row"
                alignItems="center"
                gap="2"
                cursor="pointer"
                background={{ base: 'buttonGlass', hover: 'backgroundSecondary' }}
                onClick={() => onSelectProvider(provider)}
              >
                <Box flexDirection="row" alignItems="center" gap="2">
                  <img
                    src={provider.info.icon}
                    alt={provider.info.name}
                    style={{ width: '20px', height: '20px' }}
                  />
                  <Text variant="normal" color="text100">
                    {provider.info.name}
                  </Text>
                </Box>
              </Card>
            ))}
          </Box>
        </Box>
      )}
    </>
  )
}
