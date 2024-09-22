import { Box, Button, Card, Modal, Switch, Text, TextInput, useToast } from '@0xsequence/design-system'
import { TokenBalance } from '@0xsequence/indexer'
import EthereumProvider from '@walletconnect/ethereum-provider'
import { ethers } from 'ethers'
import { ChangeEvent, useEffect, useState } from 'react'

import { useWalletConnectProvider } from '~/utils/ethereumprovider'
import { getTransactionReceipt } from '~/utils/receipt'

import { useSyncProviders } from '~/hooks/useSyncProviders'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'
import { CollectibleInfo } from '~/stores/CollectibleStore'
import { NetworkStore } from '~/stores/NetworkStore'
import { TokenStore } from '~/stores/TokenStore'
import { WalletConnectSignClientStore } from '~/stores/WalletConnectSignClientStore'
import { WalletStore } from '~/stores/WalletStore'

import CollectibleList from '~/components/CollectibleList'
import Networks from '~/components/Networks'
import PendingTxn from '~/components/PendingTxn'
import SelectProvider from '~/components/SelectProvider'
import SendCollectible from '~/components/SendCollectible'
import SendToken from '~/components/SendToken'
import SettingsDropdownMenu from '~/components/SettingsDropdownMenu'
import SettingsTokenList from '~/components/SettingsTokenList'
import TokenList from '~/components/TokenList'
import ConnectDapp from '~/components/signing/ConnectDapp'
import SignMessage from '~/components/signing/SignMessage'
import SignTransaction from '~/components/signing/SignTransaction'
import WalletNotDeployed from '~/components/signing/WalletNotDeployed'

import sequenceLogo from '~/assets/images/sequence-logo.svg'

export const getWalletConnectProviderDetail = (provider: EthereumProvider) => {
  return {
    info: {
      walletId: '',
      uuid: '',
      name: 'WalletConnect',
      icon: 'https://avatars.githubusercontent.com/u/37784886'
    },
    provider: provider
  }
}

function Wallet() {
  const externalProviders = useSyncProviders()

  const authStore = useStore(AuthStore)
  const tokenStore = useStore(TokenStore)
  const walletStore = useStore(WalletStore)
  const walletConnectSignClientStore = useStore(WalletConnectSignClientStore)

  const accountAddress = useObservable(authStore.accountAddress)
  const isSigningTransaction = useObservable(walletStore.isSigningTransaction)
  const isSigningMessage = useObservable(walletStore.isSigningMessage)

  const isWalletNotDeployed = useObservable(walletStore.isWalletNotDeployed)

  const toast = useToast()

  const walletConnectProvider = useWalletConnectProvider()

  useEffect(() => {
    if (
      walletConnectProvider &&
      walletConnectProvider.connected &&
      !walletStore.selectedExternalProvider.get()
    ) {
      let walletConnectProviderDetail = getWalletConnectProviderDetail(walletConnectProvider)

      let availableProviders = walletStore.availableExternalProviders.get()

      if (availableProviders) {
        walletStore.availableExternalProviders.set([walletConnectProviderDetail, ...availableProviders])
      } else {
        walletStore.availableExternalProviders.set([walletConnectProviderDetail])
      }
    }
  }, [walletConnectProvider])

  useEffect(() => {
    if (externalProviders.length > 0) {
      walletStore.availableExternalProviders.set(externalProviders)
    }
  }, [externalProviders])

  const selectedExternalProvider = useObservable(walletStore.selectedExternalProvider)
  const selectedExternalWalletAddress = useObservable(walletStore.selectedExternalWalletAddress)
  const isSendingToken = useObservable(walletStore.isSendingTokenTransaction)
  const isSendingCollectible = useObservable(walletStore.isSendingCollectibleTransaction)

  const networkStore = useStore(NetworkStore)

  const [filterZeroBalances, setFilterZeroBalances] = useState(true)

  const [pendingSendToken, setPendingSendToken] = useState<TokenBalance | undefined>(undefined)
  const [pendingSendCollectible, setPendingSendCollectible] = useState<CollectibleInfo | undefined>(undefined)

  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false)
  const [isSettingsTokenListModalOpen, setIsSettingsTokenListModalOpen] = useState(false)
  const [isSelectProviderModalOpen, setIsSelectProviderModalOpen] = useState(false)
  const [isConnectingDapp, setIsConnectingDapp] = useState(false)
  const [isSendTokenModalOpen, setIsSendTokenModalOpen] = useState(false)
  const [isSendCollectibleModalOpen, setIsSendCollectibleModalOpen] = useState(false)

  const handleTokenOnSendClick = (tokenBalance: TokenBalance) => {
    setPendingSendCollectible(undefined)
    walletStore.isSendingCollectibleTransaction.set(undefined)
    setPendingSendToken(tokenBalance)
    setIsSendTokenModalOpen(true)
  }

  const handleCollectibleOnSendClick = (collectibleInfo: CollectibleInfo) => {
    setPendingSendToken(undefined)
    walletStore.isSendingTokenTransaction.set(undefined)
    setPendingSendCollectible(collectibleInfo)
    setIsSendCollectibleModalOpen(true)
  }

  // First step of sending txn
  const handleSelectProvider = async (isChange: boolean = false) => {
    if (selectedExternalProvider === undefined || isChange) {
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

  // Third step of sending txn
  const handleSendPendingTransaction = async (to: string, amount?: string) => {
    if (!walletStore.selectedExternalProvider.get()) {
      console.warn('No external provider selected')
      return
    }

    var chainId: number

    let response: { hash: string } | undefined
    try {
      if (pendingSendToken) {
        chainId = pendingSendToken.chainId
        response = await walletStore.sendToken(pendingSendToken, to, amount)
      } else if (pendingSendCollectible) {
        chainId = pendingSendCollectible.collectibleInfoParams.chainId
        response = await walletStore.sendCollectible(pendingSendCollectible, to, amount)
      } else {
        console.warn('No pending send found')
        return
      }
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

    const network = networkStore.networkForChainId(chainId)
    if (!network) {
      throw new Error(`No network found for chainId ${chainId}`)
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

    if (pendingSendToken) {
      tokenStore.updateTokenBalance(pendingSendToken)
    }

    setPendingSendToken(undefined)
    setPendingSendCollectible(undefined)
    walletStore.isSendingTokenTransaction.set(undefined)
    walletStore.isSendingCollectibleTransaction.set(undefined)

    console.log('receipt', receipt)
  }

  const [signClientUri, setSignClientUri] = useState<string | undefined>(undefined)

  const handleConnectSignClient = async (uri: string) => {
    if (uri) {
      walletConnectSignClientStore.pair(uri)
    }
    setIsConnectingDapp(true)
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
          <Card>
            <Box marginBottom="4">
              <TextInput
                width="full"
                label="Sign Client URI"
                labelLocation="left"
                name="signClientUri"
                value={signClientUri ?? ''}
                onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                  setSignClientUri(ev.target.value)
                }}
              />
            </Box>
            <Box justifyContent="flex-end">
              <Button
                marginTop="4"
                variant="primary"
                size="md"
                shape="square"
                label="Connect Sign Client"
                disabled={!signClientUri}
                onClick={() => {
                  if (signClientUri) {
                    handleConnectSignClient(signClientUri)
                  }
                }}
              />
            </Box>
          </Card>
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
                  <Box flexDirection={'row'}>
                    <Button
                      size="xs"
                      label="Change external wallet"
                      variant="text"
                      shape="square"
                      marginRight="10"
                      onClick={() => handleSelectProvider(true)}
                    />
                    <Button
                      size="xs"
                      label="Disconnect"
                      variant="text"
                      shape="square"
                      onClick={() => handleDisconnect()}
                    />
                  </Box>
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

          {isSendingToken && (
            <Box marginTop="8" alignItems="center" justifyContent="center">
              <PendingTxn
                symbol={isSendingToken.tokenBalance?.contractInfo?.symbol ?? ''}
                chainId={isSendingToken.tokenBalance.chainId}
                to={isSendingToken.to}
                amount={isSendingToken.amount}
              />
            </Box>
          )}
          {isSendingCollectible && (
            <Box marginTop="8" alignItems="center" justifyContent="center">
              <PendingTxn
                symbol={isSendingCollectible.collectibleInfo.collectibleInfoResponse.name ?? ''}
                chainId={isSendingCollectible.collectibleInfo.collectibleInfoParams.chainId}
                to={isSendingCollectible.to}
                amount={isSendingCollectible.amount}
              />
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
            }}
          />
        </Modal>
      )}
      {isConnectingDapp && (
        <Modal size="md" onClose={() => setIsConnectingDapp(false)}>
          <ConnectDapp
            onClose={() => {
              setIsConnectingDapp(false)
            }}
          />
        </Modal>
      )}
      {isSigningTransaction && (
        <Modal size="md" onClose={() => walletStore.isSigningTransaction.set(false)}>
          <SignTransaction
            onClose={() => {
              walletStore.resetSignObservables()
              walletStore.isSigningTransaction.set(false)
            }}
          />
        </Modal>
      )}
      {isSigningMessage && (
        <Modal size="md" onClose={() => walletStore.isSigningMessage.set(false)}>
          <SignMessage
            onClose={() => {
              walletStore.resetSignObservables()
              walletStore.isSigningMessage.set(false)
            }}
          />
        </Modal>
      )}
      {isWalletNotDeployed && (
        <Modal size="md" onClose={() => walletStore.isWalletNotDeployed.set(false)}>
          <WalletNotDeployed />
        </Modal>
      )}
      {isSendTokenModalOpen && (
        <Modal size="md" onClose={() => setIsSendTokenModalOpen(false)}>
          <SendToken
            tokenBalance={pendingSendToken}
            onClose={(to, amount) => {
              setIsSendTokenModalOpen(false)

              if (to && amount) {
                handleSendPendingTransaction(to, amount)
              }
            }}
          />
        </Modal>
      )}
      {isSendCollectibleModalOpen && (
        <Modal size="md" onClose={() => setIsSendCollectibleModalOpen(false)}>
          <SendCollectible
            collectibleInfo={pendingSendCollectible}
            onClose={(to, amount) => {
              setIsSendCollectibleModalOpen(false)
              if (
                (to && pendingSendCollectible?.collectibleInfoParams.contractType === 'ERC721') ||
                (to && amount)
              ) {
                handleSendPendingTransaction(to, amount)
              }
            }}
          />
        </Modal>
      )}
    </>
  )
}

export default Wallet
