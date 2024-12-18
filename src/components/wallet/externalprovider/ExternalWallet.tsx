import {
  AddIcon,
  Box,
  Button,
  Card,
  CheckmarkIcon,
  CloseIcon,
  CopyIcon,
  Divider,
  Modal,
  Text,
  WalletIcon,
  truncateAddress
} from '@0xsequence/design-system'
import EthereumProvider from '@walletconnect/ethereum-provider'
import { useObservable } from 'micro-observables'
import { useEffect, useState } from 'react'

import { useStore } from '~/stores'
import { WalletStore } from '~/stores/WalletStore'

import SelectProvider from '~/components/wallet/externalprovider/SelectProvider'
import { ButtonWithIcon } from '~/components/misc/ButtonWithIcon'
import { ExternalIcon } from '~/components/misc/ExternalIcon'

export default function ExternalWallet() {
  const walletStore = useStore(WalletStore)
  const selectedExternalProvider = useObservable(walletStore.selectedExternalProvider)
  const selectedExternalWalletAddress = useObservable(walletStore.selectedExternalWalletAddress)

  const [isSelectProviderModalOpen, setIsSelectProviderModalOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (isCopied) {
      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    }
  }, [isCopied])

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

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedExternalWalletAddress!)
    setIsCopied(true)
  }

  return (
    <Box flexDirection="column" width="full">
      <Box justifyContent="space-between" alignItems="center" gap="2">
        <Box alignItems="center" gap="2">
          <WalletIcon color="text100" width="5" height="5" />

          <Text variant="normal" fontWeight="bold" color="text100">
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
              <ExternalIcon background="text80" src={selectedExternalProvider.info.icon} />

              <Box flexDirection="column" gap="1">
                <Text variant="normal" fontWeight="bold" color="text80">
                  {selectedExternalProvider.info.name}
                </Text>

                <Box gap="1">
                  <Text variant="normal" fontWeight="medium" color="text50" width="full">
                    {truncateAddress(selectedExternalWalletAddress || '', 10, 4)}
                  </Text>

                  {isCopied ? (
                    <CheckmarkIcon color="borderNormal" cursor="pointer" onClick={() => handleCopy()} />
                  ) : (
                    <CopyIcon color="borderNormal" cursor="pointer" onClick={() => handleCopy()} />
                  )}
                </Box>
              </Box>
            </Box>

            <ButtonWithIcon icon={<CloseIcon color="text100" />} onClick={() => handleDisconnect()} />
          </Box>
        ) : (
          <Text textAlign="center" variant="normal" color="text50" padding="4">
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
