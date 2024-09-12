import { Box, Card, Divider, Text } from '@0xsequence/design-system'
import { WalletConnectModal } from '@walletconnect/modal'
import SignClient from '@walletconnect/sign-client'
import { SessionTypes } from '@walletconnect/types'
import { useEffect, useState } from 'react'

import { EIP6963ProviderDetail, useSyncProviders } from '~/hooks/useSyncProviders'

const signClient = await SignClient.init({
  projectId: '95777495732e7317ec3fd92b88a1b19c'
})

export default function SelectProvider({
  onSelectProvider
}: {
  onSelectProvider: (provider: EIP6963ProviderDetail) => void
}) {
  const providers = useSyncProviders()

  const [walletConnectModal, setWalletConnectModal] = useState<WalletConnectModal>()
  const [connectionUri, setConnectionUri] = useState<string>()
  const [approval, setApproval] = useState<Promise<SessionTypes.Struct>>()

  useEffect(() => {
    fetchConnectionUri()
    const WCModal = new WalletConnectModal({
      projectId: '95777495732e7317ec3fd92b88a1b19c',
      chains: ['eip155:1', 'eip155:137', 'eip155:2020']
    })
    setWalletConnectModal(WCModal)
  }, [])

  const fetchConnectionUri = async () => {
    try {
      const { uri, approval } = await signClient.connect({
        // Provide the namespaces and chains (e.g. `eip155` for EVM-based chains) we want to use in this session.
        requiredNamespaces: {
          eip155: {
            methods: [
              'eth_sendTransaction',
              'eth_signTransaction',
              'eth_sign',
              'personal_sign',
              'eth_signTypedData'
            ],
            chains: ['eip155:1'],
            events: ['chainChanged', 'accountsChanged']
          }
        }
      })

      setConnectionUri(uri)
      setApproval(approval)
    } catch (e) {
      console.error(e)
    }
  }

  const onSessionConnect = async (session: SessionTypes.Struct) => {
    console.log(session)
  }

  const handleWalletConnectModalOpen = async () => {
    if (walletConnectModal && connectionUri) {
      console.log(connectionUri)

      walletConnectModal.openModal({ uri: connectionUri })

      const session = await approval

      onSessionConnect(session)
      walletConnectModal.closeModal()

      onSelectProvider(session)
    }
  }

  return (
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
  )
}
