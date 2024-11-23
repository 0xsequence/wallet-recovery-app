import {
  AddIcon,
  Box,
  Button,
  Card,
  CloseIcon,
  CopyIcon,
  Divider,
  Modal,
  Text,
  WalletIcon,
  useToast
} from '@0xsequence/design-system'
import EthereumProvider from '@walletconnect/ethereum-provider'
import { useObservable } from 'micro-observables'
import { useState } from 'react'

import { useStore } from '~/stores'
import { WalletStore } from '~/stores/WalletStore'

import SelectProvider from '../SelectProvider'
import { ButtonWithIcon } from '../helpers/ButtonWithIcon'
import { ExternalIcon } from '../helpers/ExternalIcon'

export default function ExternalWallet() {
  const toast = useToast()

  const walletStore = useStore(WalletStore)
  const selectedExternalProvider = useObservable(walletStore.selectedExternalProvider)
  const selectedExternalWalletAddress = useObservable(walletStore.selectedExternalWalletAddress)

  const [isSelectProviderModalOpen, setIsSelectProviderModalOpen] = useState(false)

  const handleSelectProvider = async () => {
    if (selectedExternalProvider === undefined) {
      setIsSelectProviderModalOpen(true)
    }
  }

  const handleDisconnect = async () => {
    walletStore.setExternalProvider(undefined)

    const extProvider = selectedExternalProvider
    if (extProvider?.info.name === 'WalletConnect') {
      const WCProvider = extProvider.provider as EthereumProvider
      WCProvider.disconnect()
    }
  }

  return (
    <Box flexDirection="column" width="full">
      <Box justifyContent="space-between" alignItems="center" gap="2">
        <Box alignItems="center" gap="2">
          <WalletIcon color="text100" style={{ width: '28px', height: '28px' }} />

          <Text variant="large" fontWeight="bold" color="text100">
            External Wallet
          </Text>
        </Box>

        {!selectedExternalProvider && (
          <Button
            size="sm"
            leftIcon={AddIcon}
            label="Connect Wallet"
            variant="primary"
            shape="square"
            onClick={() => handleSelectProvider()}
          />
        )}
      </Box>

      <Divider marginY="2" />

      <Card flexDirection="column">
        {selectedExternalProvider ? (
          <Box justifyContent="space-between" alignItems="center">
            <Box flexDirection="row" gap="4">
              <ExternalIcon src={selectedExternalProvider.info.icon} />

              <Box flexDirection="column" gap="1">
                <Text variant="medium" color="text100">
                  {selectedExternalProvider.info.name}
                </Text>

                <Box gap="1">
                  <Text variant="normal" color="text50" width="full">
                    {selectedExternalWalletAddress}
                  </Text>

                  <CopyIcon
                    color="borderNormal"
                    cursor="pointer"
                    onClick={() => navigator.clipboard.writeText(selectedExternalWalletAddress!)}
                  />
                </Box>
              </Box>
            </Box>

            <ButtonWithIcon icon={<CloseIcon color="text100" />} onClick={() => handleDisconnect()} />
          </Box>
        ) : (
          <Text alignSelf="center" variant="large" color="text50" padding="4">
            Connect an external wallet to relay transactions
          </Text>
        )}
      </Card>
      {isSelectProviderModalOpen && (
        <Modal size="sm" onClose={() => setIsSelectProviderModalOpen(false)}>
          <SelectProvider
            onSelectProvider={async provider => {
              if (provider) {
                if (walletStore.selectedExternalProvider.get()?.info.name === 'WalletConnect') {
                  const walletConnectProvider = walletStore.selectedExternalProvider.get()
                    ?.provider as EthereumProvider
                  await walletConnectProvider.disconnect()
                }

                toast({
                  variant: 'success',
                  title: 'External wallet added successfully',
                  description: 'You can now relay transactions.'
                })

                walletStore.setExternalProvider(provider)
              }
              setIsSelectProviderModalOpen(false)
            }}
          />
        </Modal>
      )}
    </Box>
  )
}
