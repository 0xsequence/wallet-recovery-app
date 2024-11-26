import { Box, Modal, Text, useMediaQuery, useToast } from '@0xsequence/design-system'
import { TokenBalance } from '@0xsequence/indexer'
import { ConnectOptions, MessageToSign } from '@0xsequence/provider'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'

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

import Networks from '~/components/network/Networks'
import RecoveryHeader from '~/components/recovery/RecoveryHeader'
import SignClientTransactionConfirm from '~/components/signing/SignClientTransactionConfirm'
import SignClientTransactionRelay from '~/components/signing/SignClientTransactionRelay'
import DappList from '~/components/wallet/DappList'
import ExternalWallet from '~/components/wallet/ExternalWallet'
import PendingIndicator from '~/components/wallet/PendingIndicator'
import CollectibleList from '~/components/wallet/collectibles/CollectibleList'
import SendCollectible from '~/components/wallet/collectibles/SendCollectible'
import SendToken from '~/components/wallet/tokens/SendToken'
import TokenList from '~/components/wallet/tokens/TokenList'

export const WALLET_WIDTH = 800

function Wallet() {
  const externalProviders = useSyncProviders()

  const authStore = useStore(AuthStore)
  const tokenStore = useStore(TokenStore)
  const walletStore = useStore(WalletStore)
  const networkStore = useStore(NetworkStore)
  const walletConnectSignClientStore = useStore(WalletConnectSignClientStore)

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

  const [pendingSendToken, setPendingSendToken] = useState<TokenBalance | undefined>(undefined)
  const [pendingSendCollectible, setPendingSendCollectible] = useState<CollectibleInfo | undefined>(undefined)

  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false)
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
    walletStore.resetSignObservables()
    walletConnectSignClientStore.rejectRequest()
    walletStore.toSignPermission.set('cancelled')
  }

  async function handleSignTxn(details: {
    txn: ethers.Transaction[] | ethers.TransactionRequest[]
    chainId?: number
    origin?: string
    projectAccessKey?: string
  }) {
    const signTransaction = async (
      txn: ethers.Transaction[] | ethers.TransactionRequest[],
      chainId?: number
    ): Promise<{ hash: string }> => {
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
        result = await signTransaction(details.txn, details.chainId)
        handlePendingSignTransaction(result.hash, details.chainId!)

        walletStore.toSignResult.set(result)
        walletStore.toSignPermission.set('approved')
        walletStore.isSigningTxn.set(false)
      } catch (error) {
        toast({
          variant: 'error',
          title: 'Transaction failed',
          description: `Please try again.`
        })
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
        toast({
          variant: 'error',
          title: 'Transaction failed',
          description: `Please try again.`
        })
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
        paddingBottom="20"
      >
        <Box flexDirection="column">
          <Box flexDirection="column" gap="5">
            <Text variant="normal" fontWeight="bold" color="text50">
              External connections
            </Text>

            <ExternalWallet />

            <DappList />
          </Box>

          <PendingIndicator paddingY="5" />

          <Box flexDirection="column" gap="5">
            <Text variant="normal" fontWeight="bold" color="text50">
              My Sequence wallet
            </Text>

            <TokenList onSendClick={handleTokenOnSendClick} />

            <CollectibleList onSendClick={handleCollectibleOnSendClick} />
          </Box>
        </Box>
      </Box>

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
          <SignClientTransactionRelay
            onClose={() => {
              cancelRequest()
            }}
            handleSignTxn={details => handleSignTxn(details)}
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
          <SignClientTransactionConfirm
            onClose={details => {
              walletStore.isSigningMsg.set(false)
              if (!details) {
                cancelRequest()
              } else {
                handleSignMsg(details)
              }
            }}
          />
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
