import { TokenBalance } from '@0xsequence/indexer'
import { useCallback, useEffect, useState } from 'react'
import { CollectibleInfo } from '~/stores/CollectibleStore'
import { WalletStore } from '~/stores/WalletStore'

/**
 * Manages all modal states and their associated data
 */
export function useModalManagement(walletStore: WalletStore, isNetworkModalOpenObservable: boolean) {
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false)
  const [isSendTokenModalOpen, setIsSendTokenModalOpen] = useState(false)
  const [isSendCollectibleModalOpen, setIsSendCollectibleModalOpen] = useState(false)

  const [pendingSendToken, setPendingSendToken] = useState<TokenBalance | undefined>(undefined)
  const [pendingSendCollectible, setPendingSendCollectible] = useState<CollectibleInfo | undefined>(undefined)

  useEffect(() => {
    setIsNetworkModalOpen(isNetworkModalOpenObservable)
  }, [isNetworkModalOpenObservable])

  const openSendTokenModal = useCallback((tokenBalance: TokenBalance) => {
    setPendingSendCollectible(undefined)
    walletStore.isSendingCollectibleTransaction.set(undefined)
    setPendingSendToken(tokenBalance)
    setIsSendTokenModalOpen(true)
  }, [walletStore])

  const closeSendTokenModal = useCallback(() => {
    setIsSendTokenModalOpen(false)
    setPendingSendToken(undefined)
    walletStore.isSendingTokenTransaction.set(undefined)
  }, [walletStore])

  const openSendCollectibleModal = useCallback((collectibleInfo: CollectibleInfo) => {
    setPendingSendToken(undefined)
    walletStore.isSendingTokenTransaction.set(undefined)
    setPendingSendCollectible(collectibleInfo)
    setIsSendCollectibleModalOpen(true)
  }, [walletStore])

  const closeSendCollectibleModal = useCallback(() => {
    setIsSendCollectibleModalOpen(false)
    setPendingSendCollectible(undefined)
    walletStore.isSendingCollectibleTransaction.set(undefined)
  }, [walletStore])

  return {
    networkModal: {
      isOpen: isNetworkModalOpen,
      close: () => setIsNetworkModalOpen(false)
    },
    sendTokenModal: {
      isOpen: isSendTokenModalOpen,
      open: openSendTokenModal,
      close: closeSendTokenModal,
      pendingToken: pendingSendToken
    },
    sendCollectibleModal: {
      isOpen: isSendCollectibleModalOpen,
      open: openSendCollectibleModal,
      close: closeSendCollectibleModal,
      pendingCollectible: pendingSendCollectible
    }
  }
}
