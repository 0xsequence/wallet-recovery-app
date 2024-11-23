import { Box, Button, Modal, Switch, Text, useMediaQuery, useToast } from '@0xsequence/design-system'
import { TokenBalance } from '@0xsequence/indexer'
import { ConnectOptions, MessageToSign } from '@0xsequence/provider'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useWalletConnectProvider } from '~/utils/ethereumprovider'
import { getWalletConnectProviderDetail } from '~/utils/ethereumprovider'
import { getTransactionReceipt } from '~/utils/receipt'

import { useSyncProviders } from '~/hooks/useSyncProviders'

import { useObservable, useStore } from '~/stores'
import { AuthStore } from '~/stores/AuthStore'
import { CollectibleInfo } from '~/stores/CollectibleStore'
import { NetworkStore } from '~/stores/NetworkStore'
import { TokenStore } from '~/stores/TokenStore'
import { WalletConnectSignClientStore } from '~/stores/WalletConnectSignClientStore'
import { WalletStore } from '~/stores/WalletStore'

import PendingTxn from '~/components/PendingTxn'
import SendCollectible from '~/components/SendCollectible'
import SendToken from '~/components/SendToken'
import Networks from '~/components/network/Networks'
import RecoveryHeader from '~/components/recovery/RecoveryHeader'
import SignClientMessageRequest from '~/components/signing/SignClientMessageRequest'
import SignClientTransactionRequest from '~/components/signing/SignClientTransactionRequest'
import SignClientWarning from '~/components/signing/SignClientWarning'
import CollectibleList from '~/components/wallet/CollectibleList'
import DappList from '~/components/wallet/DappList'
import ExternalWallet from '~/components/wallet/ExternalWallet'
import TokenList from '~/components/wallet/TokenList'

export const WALLET_WIDTH = 800

function Wallet() {
  const externalProviders = useSyncProviders()

  const authStore = useStore(AuthStore)
  const tokenStore = useStore(TokenStore)
  const walletStore = useStore(WalletStore)
  const networkStore = useStore(NetworkStore)
  const walletConnectSignClientStore = useStore(WalletConnectSignClientStore)

  const navigate = useNavigate()

  const accountAddress = useObservable(authStore.accountAddress)
  const isSigningTxn = useObservable(walletStore.isSigningTxn)
  const isSigningMsg = useObservable(walletStore.isSigningMsg)

  const networks = useObservable(networkStore.networks)

  const toast = useToast()

  const isMobile = useMediaQuery('isMobile')

  const walletConnectProvider = useWalletConnectProvider()

  useEffect(() => {
    if (accountAddress && networks.length > 0) {
      tokenStore.loadBalances(accountAddress, networks)
    }
  }, [accountAddress, networks])

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

  const isSendingToken = useObservable(walletStore.isSendingTokenTransaction)
  const isSendingCollectible = useObservable(walletStore.isSendingCollectibleTransaction)
  const isSendingSignedTokenTransaction = useObservable(walletStore.isSendingSignedTokenTransaction)

  const [pendingSendToken, setPendingSendToken] = useState<TokenBalance | undefined>(undefined)
  const [pendingSendCollectible, setPendingSendCollectible] = useState<CollectibleInfo | undefined>(undefined)

  const [isConfirmSignOutModalOpen, setIsConfirmSignOutModalOpen] = useState(false)
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false)
  const [isSendTokenModalOpen, setIsSendTokenModalOpen] = useState(false)
  const [isSendCollectibleModalOpen, setIsSendCollectibleModalOpen] = useState(false)

  const signClientWarningType = useObservable(walletStore.signClientWarningType)

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

    const provider = networkStore.providerForChainId(chainId)

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
    const rpcProvider = networkStore.providerForChainId(chainId)
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

  async function handleSignTxn(details: {
    txn: ethers.Transaction[] | ethers.TransactionRequest[]
    chainId: number
    options: ConnectOptions
  }) {
    const signTransaction = async (
      txn: ethers.Transaction[] | ethers.TransactionRequest[],
      chainId: number,
      _options?: ConnectOptions
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

    const provider = walletStore.selectedExternalProvider.get()?.provider
    const account = authStore.account

    let result: { hash: string } | undefined

    if (details) {
      try {
        walletStore.isSendingSignedTokenTransaction.set(details)
        result = await signTransaction(details.txn, details.chainId, details.options)
        handlePendingSignTransaction(result.hash, details.chainId!)

        walletStore.toSignResult.set(result)
        walletStore.toSignPermission.set('approved')
      } catch (error) {
        walletStore.isSendingSignedTokenTransaction.set(undefined)
        cancelRequest()
        throw error
      }
    }
  }

  async function handleSignMsg(details: {
    message: MessageToSign
    chainId: number
    options?: ConnectOptions
  }) {
    const signMessage = async (msg: MessageToSign, _options?: ConnectOptions): Promise<{ hash: string }> => {
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

    const account = authStore.account

    let result: { hash: string } | undefined

    if (details) {
      try {
        result = await signMessage(details.message)

        walletStore.toSignResult.set(result)
        walletStore.toSignPermission.set('approved')
      } catch (error) {
        walletStore.isSendingSignedTokenTransaction.set(undefined)
        cancelRequest()
        throw error
      }
    }
  }

  return (
    <Box>
      <RecoveryHeader handleNetworkModal={() => setIsNetworkModalOpen(true)} />

      <Box
        justifySelf="center"
        flexDirection="column"
        padding="5"
        width="full"
        style={{ maxWidth: '800px' }}
        paddingBottom="10"
      >
        <Box flexDirection="column" gap="12">
          <Box flexDirection="column" gap="5">
            <Text variant="normal" fontWeight="bold" color="text50">
              External connections
            </Text>

            <ExternalWallet />

            <DappList />
          </Box>
          <Box flexDirection="column" gap="5">
            <Text variant="normal" fontWeight="bold" color="text50">
              My Sequence wallet
            </Text>

            <TokenList onSendClick={handleTokenOnSendClick} />

            <Box flexDirection="column" alignItems="flex-start" justifyContent="flex-start" marginTop="8">
              <Text variant="large" color="text80" marginBottom="4">
                Collectibles
              </Text>
              <CollectibleList onSendClick={handleCollectibleOnSendClick} />
            </Box>
          </Box>
        </Box>
      </Box>
      <Box
        flexDirection="column"
        background="backgroundPrimary"
        width="full"
        height="full"
        alignItems="center"
        justifyContent="center"
      >
        <Box width="full" paddingX="8" style={{ maxWidth: '800px' }}>
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
                to={isSendingSignedTokenTransaction.txn[0].to as string}
                amount={String(Number(isSendingSignedTokenTransaction.txn[0].value))}
              />
            </Box>
          )}
        </Box>
      </Box>
      {isConfirmSignOutModalOpen && (
        <Modal size="sm" onClose={() => setIsConfirmSignOutModalOpen(false)}>
          <Box flexDirection="column" padding="8">
            <Text variant="medium" color="text80" marginRight="8">
              You will need to re-enter your mnemonic if you sign out. Continue?
            </Text>
            <Box flexDirection="row" width="full" justifyContent="flex-end" marginTop="8" gap="4">
              <Button
                label="Sign Out"
                shape="square"
                variant="primary"
                onClick={() => {
                  authStore.logout()
                  navigate('/')
                }}
              />
              <Button label="Cancel" shape="square" onClick={() => setIsConfirmSignOutModalOpen(false)} />
            </Box>
          </Box>
        </Modal>
      )}
      {isNetworkModalOpen && (
        <Modal
          onClose={() => {
            setIsNetworkModalOpen(false)
            networkStore.discardUnsavedNetworkEdits()
            networkStore.isAddingNetwork.set(false)
          }}
          contentProps={{
            style: {
              scrollbarColor: 'gray black',
              scrollbarWidth: 'thin'
            }
          }}
        >
          <Networks />
        </Modal>
      )}

      {isSigningTxn && (
        <Modal
          isDismissible={false}
          size="md"
          contentProps={{
            style: { width: !isMobile ? '800px' : '100%', maxHeight: '100%', overflowY: 'auto' }
          }}
        >
          <SignClientTransactionRequest
            onClose={details => {
              walletStore.isSigningTxn.set(false)
              if (!details) {
                cancelRequest()
              } else if (walletStore.selectedExternalProvider.get() === undefined) {
                cancelRequest()
                walletStore.signClientWarningType.set('noProvider')
              } else if (walletStore.selectedExternalProvider.get()?.info.name === 'WalletConnect') {
                cancelRequest()
                walletStore.signClientWarningType.set('isWalletConnect')
              } else {
                handleSignTxn(details)
              }
            }}
          />
        </Modal>
      )}
      {isSigningMsg && (
        <Modal
          isDismissible={false}
          size="md"
          contentProps={{
            style: { width: !isMobile ? '800px' : '100%', maxHeight: '90%', overflowY: 'auto' }
          }}
        >
          <SignClientMessageRequest
            onClose={details => {
              walletStore.isSigningMsg.set(false)
              if (!details) {
                cancelRequest()
              } else if (walletStore.selectedExternalProvider.get() === undefined) {
                cancelRequest()
                walletStore.signClientWarningType.set('noProvider')
              } else if (walletStore.selectedExternalProvider.get()?.info.name === 'WalletConnect') {
                cancelRequest()
                walletStore.signClientWarningType.set('isWalletConnect')
              } else {
                handleSignMsg(details)
              }
            }}
          />
        </Modal>
      )}
      {signClientWarningType && (
        <Modal size="md" onClose={() => walletStore.signClientWarningType.set(false)}>
          <SignClientWarning warningType={signClientWarningType} />
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
    </Box>
  )
}

export default Wallet
