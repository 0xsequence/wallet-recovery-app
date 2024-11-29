import { Box, Button, Card, Image, Text } from '@0xsequence/design-system'
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
    <Box>
      {isConfirmingWalletConnect ? (
        <Box flexDirection="column" padding="6" gap="6">
          <Text variant="large" fontWeight="bold" color="text80">
            Use WalletConnect for External Wallet?
          </Text>
          <Card alignItems="center" gap="3" style={{ background: 'rgba(176, 126, 30, 0.3)' }}>
            <Box flexDirection="column" gap="2">
              <Text variant="medium" fontWeight="bold" color="text100">
                Attention
              </Text>
              {walletConnectDappsConnected ? (
                <Text variant="normal" color="text80">
                  If you connect your external wallet using WalletConnect, you'll lose all Dapps connections
                  you already made using WalletConnect.
                </Text>
              ) : (
                <Text variant="normal" color="text80">
                  If you connect your external wallet using WalletConnect, you won't be able to connect to any
                  other Dapps during this session. <br /> <br />
                  If you need to connect Dapps, please consider using a different external wallet instead.
                </Text>
              )}
            </Box>
            <Image src={WarningIcon} width="8" height="8" />
          </Card>
          <Box flexDirection={{ sm: 'column', md: 'row' }} gap="2" width="full" marginTop="6">
            <Button width="full" label="Cancel" shape="square" onClick={() => onSelectProvider()} />

            <Button
              width="full"
              variant="primary"
              label="Confirm"
              shape="square"
              onClick={() => handleConnectWalletConnect()}
              data-id="signingContinue"
            />
          </Box>
        </Box>
      ) : (
        <Box flexDirection="column" padding="6" gap="6">
          <Text variant="large" fontWeight="bold" color="text80">
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
                setIsConfirmingWalletConnect(true)
              }}
            >
              <Box flexDirection="row" alignItems="center" gap="2">
                <Image src={WalletConnectIcon} width="5" height="auto" />
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
                  <Image src={provider.info.icon} width="5" height="auto" />
                  <Text variant="normal" fontWeight="bold" color="text100">
                    {provider.info.name}
                  </Text>
                </Box>
              </Card>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}
