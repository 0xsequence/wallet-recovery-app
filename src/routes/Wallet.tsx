import { AccountSignerOptions } from '@0xsequence/account/dist/declarations/src/signer'
import { commons } from '@0xsequence/core'
import { Box, Button, Card, Modal, ScanIcon, Switch, Text, useToast } from '@0xsequence/design-system'
import { TokenBalance } from '@0xsequence/indexer'
import { ConnectOptions, MessageToSign } from '@0xsequence/provider'
import EthereumProvider from '@walletconnect/ethereum-provider'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'

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
import ConnectionList from '~/components/signing/ConnectionList'
import SignRequest from '~/components/signing/SignRequest'
import WalletNotDeployed from '~/components/signing/WalletNotDeployed'
import WalletScan from '~/components/signing/WalletScan'

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
  const isSigning = useObservable(walletStore.isSigning)

  const isWalletNotDeployed = useObservable(walletStore.isWalletNotDeployed)

  const sessionList = useObservable(walletConnectSignClientStore.allSessions)

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
  const isSendingSignedTokenTransaction = useObservable(walletStore.isSendingSignedTokenTransaction)

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
  const [isScanningQrWalletConnect, setIsScanningQrWalletConnect] = useState(false)

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
    // walletStore.clearWalletConnectSession()

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

  const handlePendingSignTransaction = async (hash: string, chainId: number) => {
    const network = networkStore.networkForChainId(chainId!)
    if (!network) {
      throw new Error(`No network found for chainId ${chainId}`)
    }
    const rpcProvider = new ethers.JsonRpcProvider(network.rpcUrl)

    const receipt = await getTransactionReceipt(rpcProvider, hash!)

    if (receipt) {
      walletStore.isSendingSignedTokenTransaction.set(undefined)

      toast({
        variant: 'success',
        title: 'Sign transaction confirmed',
        description: `You can view the transaction details on your connected external wallet`
      })
    }
  }

  const cancelRequest = () => {
    walletConnectSignClientStore.rejectRequest()
    walletStore.toSignPermission.set('cancelled')
  }

  async function handleSign(
    isTxn: boolean,
    details?: commons.transaction.Transactionish | MessageToSign | undefined,
    chainId?: number,
    options?: ConnectOptions | AccountSignerOptions,
    hash?: string
  ) {
    const signTransaction = async (
      txn: commons.transaction.Transactionish,
      chainId: number,
      options?: ConnectOptions
    ): Promise<{ hash: string }> => {
      // TODO do we need options?
      try {
        const providerAddress = await walletStore.getExternalProviderAddress(provider!)

        if (!providerAddress) {
          throw new Error('No provider address found')
        }

        console.log('sendTransaction chainId', chainId)

        const response = await walletStore.sendTransaction(
          account!,
          provider!,
          providerAddress,
          txn,
          chainId!
        )

        return response
      } catch (error) {
        walletStore.isSendingSignedTokenTransaction.set(undefined)
        throw error
      }
    }
    const signMessage = async (
      msg: MessageToSign,
      options?: AccountSignerOptions
    ): Promise<{ hash: string }> => {
      // TODO do we need options?
      try {
        let hash: string | undefined

        if (msg.message) {
          console.log('signMessage chainId', msg.chainId)
          hash = await account!.signMessage(msg.message, msg.chainId!, msg.eip6492 ? 'eip6492' : 'throw')
        } else if (msg.typedData) {
          const typedData = msg.typedData
          hash = await account!.signTypedData(
            typedData.domain,
            typedData.types,
            typedData.message,
            msg.chainId!,
            msg.eip6492 ? 'eip6492' : 'throw'
          )
        }

        if (!hash) {
          throw new Error('Account sign method failed')
        }

        return { hash }
      } catch (error) {
        throw error
      }
    }

    const provider = walletStore.selectedExternalProvider.get()?.provider
    const account = authStore.account

    let result: { hash: string } | undefined

    if (details && chainId) {
      try {
        if (isTxn) {
          walletStore.isSendingSignedTokenTransaction.set(details)
          result = await signTransaction(details.txn, details.chainId, details.options)
          handlePendingSignTransaction(result.hash, chainId!)
        } else {
          result = await signMessage(details.message)
        }

        walletStore.toSignResult.set(result)
        walletStore.toSignPermission.set('approved')
      } catch (error) {
        walletStore.isSendingSignedTokenTransaction.set(undefined)
        cancelRequest()
        throw error
      }
    }
  }

  const handleConnectSignClient = async () => {
    setIsScanningQrWalletConnect(true)
  }

  const handleOnQrUri = async (uri: string) => {
    walletConnectSignClientStore.pair(uri)
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
          <Card flexDirection="column" alignItems="center" padding="6" marginTop="16">
            <Text variant="large" color="text80" marginBottom="4">
              Your recovered wallet address
            </Text>
            <Text variant="normal" fontWeight="bold" color="text100">
              {accountAddress}
            </Text>

            <ConnectionList sessionList={sessionList}></ConnectionList>
            <Button
              marginTop="4"
              variant="primary"
              size="sm"
              shape="square"
              label="Connect to a Dapp with WalletConnect"
              leftIcon={ScanIcon}
              onClick={() => {
                handleConnectSignClient()
              }}
            />
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
          {isSendingSignedTokenTransaction && (
            <Box marginTop="8" alignItems="center" justifyContent="center">
              <PendingTxn
                symbol={'tokens'}
                chainId={isSendingSignedTokenTransaction.chainId!}
                to={isSendingSignedTokenTransaction.txn[0].to}
                amount={String(Number(isSendingSignedTokenTransaction.txn[0].value))}
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
          <ConnectDapp onClose={() => setIsConnectingDapp(false)} />
        </Modal>
      )}
      {isScanningQrWalletConnect && (
        <Modal size="md" onClose={() => setIsScanningQrWalletConnect(false)}>
          <WalletScan
            onQrUri={uri => {
              handleOnQrUri(uri)
              setIsScanningQrWalletConnect(false)
            }}
          />
        </Modal>
      )}
      {isSigning && (
        <Modal isDismissible={false} size="md">
          <SignRequest
            isTxn={isSigning === 'txn'}
            onClose={(details, chainId, options) => {
              handleSign(isSigning === 'txn', details, chainId, options)
              walletStore.isSigning.set(false)
              if (!details && !chainId && !options) {
                cancelRequest()
              }
              if (walletStore.selectedExternalProvider.get() === undefined) {
                cancelRequest()
                walletStore.isWalletNotDeployed.set(true)
              }
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
