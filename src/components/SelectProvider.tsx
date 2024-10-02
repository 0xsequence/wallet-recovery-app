import { Box, Card, Divider, Text } from '@0xsequence/design-system'
import EthereumProvider from '@walletconnect/ethereum-provider'
import { useState } from 'react'

import { createProvider } from '~/utils/ethereumprovider'

import { EIP1193Provider, useSyncProviders } from '~/hooks/useSyncProviders'

import { useStore } from '~/stores'
import { WalletConnectSignClientStore } from '~/stores/WalletConnectSignClientStore'

import { getWalletConnectProviderDetail } from '~/routes/Wallet'

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
      'To continue, all WalletConnect Dapp sessions must and will be disconnected. Would you like to Continue?'
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

        const walletConnectProvider = await createProvider(true)
        await walletConnectProvider.enable()

        // walletStore.setWalletConnectSession(walletConnectProvider.session)

        let walletConnectProviderDetail = getWalletConnectProviderDetail(walletConnectProvider)

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
