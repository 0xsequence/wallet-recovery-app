import { useEffect, useState } from 'react'
import { useObservable } from 'micro-observables'
import { useStore } from '~/stores'
import { WalletStore } from '~/stores/WalletStore'

export type SendFormState = {
  amount: string | undefined
  toAddress: string | undefined
  sendToExternalWallet: boolean
  isSendingToExternalWallet: boolean
  setAmount: (amount: string | undefined) => void
  setToAddress: (address: string | undefined) => void
  setSendToExternalWallet: (value: boolean) => void
}

/**
 * Hook to manage send form state and external wallet address syncing
 */
export function useSendForm(
  defaultAmount?: string,
  defaultToAddress?: string
): SendFormState {
  const walletStore = useStore(WalletStore)
  const selectedExternalWalletAddress = useObservable(walletStore.selectedExternalWalletAddress)

  const [amount, setAmount] = useState<string | undefined>(defaultAmount)
  const [toAddress, setToAddress] = useState<string | undefined>(defaultToAddress)
  const [sendToExternalWallet, setSendToExternalWallet] = useState(true)

  // Check if the address matches the external wallet address (case-insensitive)
  const isSendingToExternalWallet =
    !!toAddress &&
    !!selectedExternalWalletAddress &&
    toAddress.toLowerCase() === selectedExternalWalletAddress.toLowerCase()

  // Sync with external wallet when checkbox is toggled
  useEffect(() => {
    const externalWalletAddress = walletStore.selectedExternalWalletAddress.get()

    if (sendToExternalWallet && externalWalletAddress) {
      setToAddress(externalWalletAddress)
    }
  }, [sendToExternalWallet, walletStore])

  return {
    amount,
    toAddress,
    sendToExternalWallet,
    isSendingToExternalWallet,
    setAmount,
    setToAddress,
    setSendToExternalWallet
  }
}
