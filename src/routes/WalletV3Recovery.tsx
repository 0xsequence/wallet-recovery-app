
import { TokenBalance } from '@0xsequence/indexer'
import { useEffect, useState } from 'react'

import { useObservable, useStore } from '~/stores'
import { CollectibleInfo } from '~/stores/CollectibleStore'
import { WalletStore } from '~/stores/WalletStore'
import { NetworkStore } from '~/stores/NetworkStore'
import { AuthStore } from '~/stores/AuthStore'

import RecoveryHeader from '~/components/header/RecoveryHeader'
import { useQueuedPayloads } from '~/hooks/use-queued-payloads'
import { useExternalProviderSync } from '~/hooks/use-external-provider-sync'
import { useTransactionSigning } from '~/hooks/use-transaction-signing'
import { useTokenRecovery } from '~/hooks/use-token-recovery'
import { useWalletInitialization } from '~/hooks/use-wallet-initialization'

// Modal components
import { NetworkModal } from '~/components/wallet/modals/NetworkModal'
import { SignTransactionModal } from '~/components/wallet/modals/SignTransactionModal'
import { SignMessageModal } from '~/components/wallet/modals/SignMessageModal'
import { SendTokenModal } from '~/components/wallet/modals/SendTokenModal'
import { SendCollectibleModal } from '~/components/wallet/modals/SendCollectibleModal'

// Section components
import { WalletConnectionsSection } from '~/components/wallet/sections/WalletConnectionsSection'
import { WalletAssetsSection } from '~/components/wallet/sections/WalletAssetsSection'
import { WalletRecoverySection } from '~/components/wallet/sections/WalletRecoverySection'

export const WALLET_WIDTH = 800

function WalletV3Recovery() {
  const walletStore = useStore(WalletStore)
  const networkStore = useStore(NetworkStore)
  const authStore = useStore(AuthStore)

  const isSigningTxn = useObservable(walletStore.isSigningTxn)
  const isSigningMsg = useObservable(walletStore.isSigningMsg)
  const isNetworkModalOpen = useObservable(walletStore.isNetworkModalOpen)
  const isLoadingAccountObservable = useObservable(authStore.isLoadingAccount)
  const hasAccount = useObservable(authStore.accountAddress)

  const [isLoadingAccount, setIsLoadingAccount] = useState(false)

  useEffect(() => {
    setIsLoadingAccount(isLoadingAccountObservable)
  }, [isLoadingAccountObservable])

  useExternalProviderSync()
  const { isV2Wallet } = useWalletInitialization()
  const { handleSignTxn, handleSignMsg, cancelRequest } = useTransactionSigning()
  const { handleEnqueueTokenPayload, handleEnqueueCollectiblePayload } = useTokenRecovery()
  const { payloads: queuedPayloads, isLoading, refetch } = useQueuedPayloads()

  // Modal states
  const [pendingSendToken, setPendingSendToken] = useState<TokenBalance | undefined>(undefined)
  const [pendingSendCollectible, setPendingSendCollectible] = useState<CollectibleInfo | undefined>(undefined)
  const [isSendTokenModalOpen, setIsSendTokenModalOpen] = useState(false)
  const [isSendCollectibleModalOpen, setIsSendCollectibleModalOpen] = useState(false)
  const [isSendTokenModalDismissible, setIsSendTokenModalDismissible] = useState(true)
  const [isSendCollectibleModalDismissible, setIsSendCollectibleModalDismissible] = useState(true)

  // Handlers for opening modals
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

  // Handlers for closing modals
  const handleCloseSendToken = () => {
    setPendingSendToken(undefined)
    setIsSendTokenModalOpen(false)
  }

  const handleCloseSendCollectible = () => {
    setPendingSendCollectible(undefined)
    setIsSendCollectibleModalOpen(false)
  }

  const handleSignMsgWithClose = (details?: any) => {
    walletStore.isSigningMsg.set(false)
    if (!details) {
      cancelRequest()
    } else {
      handleSignMsg(details)
    }
  }

  // If no account and not loading, redirect would happen via route guard
  if (!hasAccount && !isLoadingAccount) {
    return null
  }

  return (
    <div>
      <RecoveryHeader />

      <div className='flex flex-col items-center'>
        <div className='flex flex-col p-5 w-full pb-20' style={{ maxWidth: WALLET_WIDTH }} >
          <div className='flex flex-col'>
            <WalletConnectionsSection />

            <WalletAssetsSection
              onTokenSendClick={handleTokenOnSendClick}
              onCollectibleSendClick={handleCollectibleOnSendClick}
            />
          </div>

          <WalletRecoverySection
            isV2Wallet={isV2Wallet}
            queuedPayloads={queuedPayloads}
            isLoading={isLoading}
            refetch={refetch}
          />
        </div>
      </div>

      {/* Modals */}
      <NetworkModal
        isOpen={isNetworkModalOpen}
        onClose={() => walletStore.isNetworkModalOpen.set(false)}
        networkStore={networkStore}
        walletStore={walletStore}
      />

      <SignTransactionModal
        isOpen={isSigningTxn}
        onCancel={cancelRequest}
        onSign={handleSignTxn}
      />

      <SignMessageModal
        isOpen={isSigningMsg}
        onClose={handleSignMsgWithClose}
      />

      <SendTokenModal
        isOpen={isSendTokenModalOpen}
        isDismissible={isSendTokenModalDismissible}
        tokenBalance={pendingSendToken}
        onClose={handleCloseSendToken}
        onRecover={async ({ amount }) => {
          if (amount && pendingSendToken) {
            return await handleEnqueueTokenPayload(pendingSendToken, amount)
          }
          return undefined
        }}
        onDismissibleChange={setIsSendTokenModalDismissible}
      />

      <SendCollectibleModal
        isOpen={isSendCollectibleModalOpen}
        isDismissible={isSendCollectibleModalDismissible}
        collectibleInfo={pendingSendCollectible}
        onClose={handleCloseSendCollectible}
        onRecover={async ({ amount }) => {
          if (amount && pendingSendCollectible) {
            return await handleEnqueueCollectiblePayload(pendingSendCollectible, amount)
          }
          return undefined
        }}
        onDismissibleChange={setIsSendCollectibleModalDismissible}
      />
    </div>
  )
}


export default WalletV3Recovery
