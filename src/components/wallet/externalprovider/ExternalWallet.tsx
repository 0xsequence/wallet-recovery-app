import {
  AddIcon,
  Button,
  Card,
  CheckmarkIcon,
  CloseIcon,
  CopyIcon,
  IconButton,
  Modal,
  Text,
  WalletIcon,
} from '@0xsequence/design-system'
import EthereumProvider from '@walletconnect/ethereum-provider'
import { useObservable } from 'micro-observables'
import { useEffect, useState } from 'react'

import { useStore } from '~/stores'
import { WalletStore } from '~/stores/WalletStore'

import SelectProvider from '~/components/wallet/externalprovider/SelectProvider'
import { ExternalIcon } from '~/components/misc/ExternalIcon'
import { truncateAddress } from '~/utils/truncateAddress'
import { Address } from 'viem'

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
    <div className='flex flex-col w-full'>
      <div className='flex flex-row justify-between items-center gap-2'>
        <div className='flex flex-row items-center gap-2'>
          <WalletIcon color="text100" width="5" height="5" />

          <Text variant="normal" fontWeight="bold" color="text100">
            External Wallet
          </Text>
        </div>

        {!selectedExternalProvider && (
          <Button
            size="sm"
            variant="primary"
            shape="square"
            onClick={() => handleSelectProvider()}
          >
            <AddIcon />
            Connect Wallet
          </Button>
        )}
      </div>

      <div className='h-0 my-2' />

      <Card className='flex flex-col'>
        {selectedExternalProvider ? (
          <div className='flex flex-row justify-between items-center'>
            <div className='flex flex-row gap-4'>
              <ExternalIcon src={selectedExternalProvider.info.icon} />

              <div className='flex flex-col gap-1'>
                <Text variant="normal" fontWeight="bold" color="text80">
                  {selectedExternalProvider.info.name}
                </Text>

                <div className='flex flex-row items-center gap-1'>
                  <Text variant="normal" fontWeight="medium" color="text50" className='w-full'>
                    {truncateAddress(selectedExternalWalletAddress as Address, 10, 4)}
                  </Text>

                  {isCopied ? (
                    <IconButton shape="square" size="xs" icon={CheckmarkIcon} onClick={() => handleCopy()} />
                  ) : (
                    <IconButton shape="square" size="xs" icon={CopyIcon} onClick={() => handleCopy()} />
                  )}
                </div>
              </div>
            </div>

            <IconButton shape="square" size="xs" icon={CloseIcon} onClick={() => handleDisconnect()} />
          </div>
        ) : (
          <Text variant="normal" color="text50" className='p-4'>
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
    </div>
  )
}
