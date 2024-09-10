import { Box, Button, Card, Modal, Switch, Text, useToast } from '@0xsequence/design-system'
import { TokenBalance } from '@0xsequence/indexer'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'

import { getTransactionReceipt } from '~/utils/receipt'

import { useSyncProviders } from '~/hooks/useSyncProviders'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'
import { CollectibleInfo, CollectibleStore } from '~/stores/CollectibleStore'
import { NetworkStore } from '~/stores/NetworkStore'
import { TokenStore } from '~/stores/TokenStore'
import { WalletStore } from '~/stores/WalletStore'

import CollectibleList from '~/components/CollectibleList'
import Networks from '~/components/Networks'
import PendingTxn from '~/components/PendingTxn'
import PendingTxnCollectible from '~/components/PendingTxnCollectible'
import SelectProvider from '~/components/SelectProvider'
import SendCollectible from '~/components/SendCollectible'
import SendToken from '~/components/SendToken'
import SettingsDropdownMenu from '~/components/SettingsDropdownMenu'
import SettingsTokenList from '~/components/SettingsTokenList'
import TokenList from '~/components/TokenList'

import sequenceLogo from '~/assets/images/sequence-logo.svg'

function Wallet() {
  const externalProviders = useSyncProviders()

  const toast = useToast()

  useEffect(() => {
    if (externalProviders.length > 0) {
      walletStore.availableExternalProviders.set(externalProviders)
    }
  }, [externalProviders])

  const authStore = useStore(AuthStore)
  const tokenStore = useStore(TokenStore)
  const collectibleStore = useStore(CollectibleStore)
  const walletStore = useStore(WalletStore)

  const accountAddress = useObservable(authStore.accountAddress)

  const selectedExternalProvider = useObservable(walletStore.selectedExternalProvider)
  const selectedExternalWalletAddress = useObservable(walletStore.selectedExternalWalletAddress)
  const isSendingTransaction = useObservable(walletStore.isSendingTransaction)
  const isSendingCollectible = useObservable(walletStore.isSendingTransactionCollectible)

  const networkStore = useStore(NetworkStore)

  const [filterZeroBalances, setFilterZeroBalances] = useState(true)

  const [pendingSendToken, setPendingSendToken] = useState<TokenBalance | undefined>(undefined)
  const [pendingSendCollectible, setPendingSendCollectible] = useState<CollectibleInfo | undefined>(undefined)

  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false)
  const [isSettingsTokenListModalOpen, setIsSettingsTokenListModalOpen] = useState(false)
  const [isSelectProviderModalOpen, setIsSelectProviderModalOpen] = useState(false)
  const [isSendTokenModalOpen, setIsSendTokenModalOpen] = useState(false)
  const [isSendCollectibleModalOpen, setIsSendCollectibleModalOpen] = useState(false)

  const handleTokenOnSendClick = (tokenBalance: TokenBalance) => {
    setPendingSendToken(tokenBalance)

    if (selectedExternalProvider) {
      handleSelectAmountAndAddress(tokenBalance)
    } else {
      handleSelectProvider()
    }
  }

  const handleCollectibleOnSendClick = (collectibleInfo: CollectibleInfo) => {
    setPendingSendCollectible(collectibleInfo)

    if (selectedExternalProvider) {
      handleSelectAmountAndAddressCollectibles(collectibleInfo)
    } else {
      handleSelectProvider()
    }
  }

  // First step of sending txn
  const handleSelectProvider = async (isChange: boolean = false) => {
    if (selectedExternalProvider === undefined || isChange) {
      setIsSelectProviderModalOpen(true)
    } else {
      handleSelectAmountAndAddress()
    }
  }

  // Second step of sending txn
  const handleSelectAmountAndAddress = async (balance?: TokenBalance) => {
    if (!walletStore.selectedExternalProvider.get()) {
      console.warn('No external provider selected')
      return
    }

    if (!pendingSendToken) {
      if (balance) {
        setPendingSendToken(balance)
      } else {
        console.warn('No pending send found')
        return
      }
    }

    setIsSendTokenModalOpen(true)
  }

  const handleSelectAmountAndAddressCollectibles = async (collectibleInfo: CollectibleInfo) => {
    if (!walletStore.selectedExternalProvider.get()) {
      console.warn('No external provider selected')
      return
    }

    if (!pendingSendCollectible) {
      if (collectibleInfo) {
        setPendingSendCollectible(collectibleInfo)
      } else {
        console.warn('No pending send found')
        return
      }
    }

    setIsSendCollectibleModalOpen(true)
  }

  // Third step of sending txn
  const handleSendPendingTransaction = async (amount: string, to: string) => {
    if (!walletStore.selectedExternalProvider.get()) {
      console.warn('No external provider selected')
      return
    }

    if (!pendingSendToken) {
      console.warn('No pending send found')
      return
    }
    let response: { hash: string } | undefined
    try {
      response = await walletStore.sendToken(pendingSendToken, amount, to)
    } catch (error) {
      if ((error as any).code === 4001) {
        toast({
          variant: 'error',
          title: 'User denied transaction signature.'
        })
      }
      console.error(error)
      return
    }

    const network = networkStore.networkForChainId(pendingSendToken.chainId)
    if (!network) {
      throw new Error(`No network found for chainId ${pendingSendToken.chainId}`)
    }

    // TODO: add providerForChainId method to NetworkStore
    const provider = new ethers.JsonRpcProvider(network.rpcUrl)

    const receipt = await getTransactionReceipt(provider, response.hash)

    if (receipt) {
      toast({
        variant: 'success',
        title: 'Transaction confirmed',
        description: `You can view the transaction details on your connected external wallet`
      })
    }

    tokenStore.updateTokenBalance(pendingSendToken)
    setPendingSendToken(undefined)
    walletStore.isSendingTransaction.set(undefined)

    console.log('receipt', receipt)
  }

  const handleSendPendingTransactionCollectibles = async (amount: string, to: string) => {
    console.log(pendingSendCollectible?.collectibleInfoParams.contractType, amount)
    if (!walletStore.selectedExternalProvider.get()) {
      console.warn('No external provider selected')
      return
    }

    if (!pendingSendCollectible) {
      console.warn('No pending send found')
      return
    }
    let response: { hash: string } | undefined
    try {
      response = await walletStore.sendCollectible(pendingSendCollectible, amount, to)
    } catch (error) {
      if ((error as any).code === 4001) {
        toast({
          variant: 'error',
          title: 'User denied transaction signature.'
        })
      }
      console.error(error)
      return
    }

    const network = networkStore.networkForChainId(pendingSendCollectible.collectibleInfoParams.chainId)
    if (!network) {
      throw new Error(`No network found for chainId ${pendingSendCollectible.collectibleInfoParams.chainId}`)
    }

    // TODO: add providerForChainId method to NetworkStore
    const provider = new ethers.JsonRpcProvider(network.rpcUrl)

    const receipt = await getTransactionReceipt(provider, response.hash)

    if (receipt) {
      toast({
        variant: 'success',
        title: 'Transaction confirmed',
        description: `You can view the transaction details on your connected external wallet`
      })
    }

    // Update collectibleStore?
    setPendingSendCollectible(undefined)
    walletStore.isSendingTransactionCollectible.set(undefined)

    console.log('receipt', receipt)
  }

  return (
    <>
      <Box
        flexDirection="column"
        background="backgroundPrimary"
        width="full"
        height="full"
        alignItems="center"
        justifyContent="center"
      >
        <Box
          flexDirection="row"
          width="full"
          background="backgroundMuted"
          paddingX="8"
          paddingY="4"
          alignItems="center"
        >
          <img src={sequenceLogo} alt="Sequence Logo" width="40" />
          <Box marginLeft="auto">
            <Button
              label="Networks"
              variant="text"
              marginRight="8"
              onClick={() => setIsNetworkModalOpen(true)}
            />

            <SettingsDropdownMenu onTokenListClick={() => setIsSettingsTokenListModalOpen(true)} />
          </Box>
        </Box>
        <Box width="full" paddingX="8" style={{ maxWidth: '800px' }}>
          <Card alignItems="center" flexDirection="column" padding="6" marginTop="16">
            <Text variant="large" color="text80" marginBottom="4">
              Your recovered wallet address
            </Text>
            <Text variant="normal" fontWeight="bold" color="text100">
              {accountAddress}
            </Text>
          </Card>

          <Card alignItems="center" flexDirection="column" padding="6" marginTop="4">
            <Text variant="large" color="text80" marginBottom="4">
              {selectedExternalProvider
                ? 'Your external wallet that will be used to relay transactions'
                : 'Connect an external wallet to relay transactions'}
            </Text>
            {selectedExternalProvider && (
              <Box flexDirection="row" alignItems="center" gap="2">
                <Box flexDirection="column" alignItems="center" gap="2">
                  <Box flexDirection="row" gap="2">
                    <img
                      src={selectedExternalProvider.info.icon}
                      alt={selectedExternalProvider.info.name}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <Text variant="normal" color="text100">
                      {selectedExternalProvider.info.name}
                    </Text>
                  </Box>
                  {selectedExternalWalletAddress && (
                    <Text variant="normal" color="text100">
                      ({selectedExternalWalletAddress})
                    </Text>
                  )}
                  <Button
                    size="xs"
                    label="Change external wallet"
                    variant="text"
                    shape="square"
                    onClick={() => handleSelectProvider(true)}
                  />
                </Box>
              </Box>
            )}
            {!selectedExternalProvider && (
              <Button
                label="Connect"
                variant="primary"
                size="md"
                shape="square"
                onClick={handleSelectProvider}
              />
            )}
          </Card>

          {isSendingTransaction && (
            <Box marginTop="8" alignItems="center" justifyContent="center">
              <PendingTxn {...isSendingTransaction} />
            </Box>
          )}

          <Box flexDirection="column" alignItems="flex-start" justifyContent="flex-start" marginTop="8">
            <Box width="full" flexDirection="row" alignItems="center" marginBottom="4">
              <Text variant="large" color="text80">
                Coins
              </Text>

              <Box marginLeft="auto">
                <Switch
                  label="Filter zero balances"
                  checked={filterZeroBalances}
                  onCheckedChange={setFilterZeroBalances}
                />
              </Box>
            </Box>

            <TokenList filterZeroBalances={filterZeroBalances} onSendClick={handleTokenOnSendClick} />
          </Box>

          {isSendingCollectible && (
            <Box marginTop="8" alignItems="center" justifyContent="center">
              <PendingTxnCollectible {...isSendingCollectible} />
            </Box>
          )}

          <Box flexDirection="column" alignItems="flex-start" justifyContent="flex-start" marginTop="8">
            <Text variant="large" color="text80" marginBottom="4">
              Collectibles
            </Text>
            <CollectibleList onSendClick={handleCollectibleOnSendClick} />
          </Box>
        </Box>
      </Box>
      {isNetworkModalOpen && (
        <Modal onClose={() => setIsNetworkModalOpen(false)}>
          <Networks />
        </Modal>
      )}
      {isSettingsTokenListModalOpen && (
        <Modal onClose={() => setIsSettingsTokenListModalOpen(false)}>
          <SettingsTokenList />
        </Modal>
      )}
      {isSelectProviderModalOpen && (
        <Modal size="md" onClose={() => setIsSelectProviderModalOpen(false)}>
          <SelectProvider
            onSelectProvider={async provider => {
              setIsSelectProviderModalOpen(false)
              walletStore.setExternalProvider(provider)

              handleSelectAmountAndAddress()
            }}
          />
        </Modal>
      )}
      {isSendTokenModalOpen && (
        <Modal size="md" onClose={() => setIsSendTokenModalOpen(false)}>
          <SendToken
            tokenBalance={pendingSendToken}
            onClose={(amount, to) => {
              setIsSendTokenModalOpen(false)

              if (amount && to) {
                handleSendPendingTransaction(amount, to)
              }
            }}
          />
        </Modal>
      )}
      {isSendCollectibleModalOpen && (
        <Modal size="md" onClose={() => setIsSendCollectibleModalOpen(false)}>
          <SendCollectible
            collectibleInfo={pendingSendCollectible}
            onClose={(amount, to) => {
              setIsSendCollectibleModalOpen(false)

              if (amount && to) {
                handleSendPendingTransactionCollectibles(amount, to)
              }
            }}
          />
        </Modal>
      )}
    </>
  )
}

export default Wallet
