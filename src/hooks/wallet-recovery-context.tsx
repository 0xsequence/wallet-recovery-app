import { Extensions } from '@0xsequence/wallet-primitives'
import { createContext, useContext, useState } from 'react'
import { Address } from 'viem'

import { useExternalWallet } from './use-external-wallet'
import { useHandleQueuePayload } from './use-handle-queue-payload'

// const TEST_TARGET_CHAIN_ID = 137 //42161
// const TEST_DESTINATION_ADDRESS = '0xb56E68Bfcf343AD57af58f93b4Ede11AB60162B5'

export const WalletRecoveryContext = createContext<RecoveryContextProps | null>(
  null
)

export function useCreateWalletRecoveryContext() {
  const [walletAddress, setWalletAddress] = useState<Address>()
  const [destinationAddress, setDestinationAddress] = useState<
    Address | undefined
  >(undefined)
  const [chainId, setChainId] = useState(0)
  const [walletSigner, setWalletSigner] = useState<Extensions.Recovery.RecoveryLeaf>()
  const {
    providers,
    provider,
    setProvider,
    recoveryPayload,
    setRecoveryPayload,
    sendRecoveryPayload,
    getWalletAddresses,
  } = useExternalWallet()
  const [transactionId, setTransactionId] = useState<string>()

  const set = {
    walletAddress: setWalletAddress,
    walletSigner: setWalletSigner,
    chainId: setChainId,
    recoveryPayload: setRecoveryPayload,
    transactionId: setTransactionId,
    destinationAddress: setDestinationAddress,
    provider: setProvider,
  }

  const values = {
    walletAddress,
    walletSigner,
    chainId,
    recoveryPayload,
    transactionId,
    destinationAddress,
    providers,
    provider,
  }

  const queuePayload = useHandleQueuePayload({
    sendRecoveryPayload,
  })

  const handle = {
    queuePayload,
    sendRecoveryPayload,
    getWalletAddresses,
  }

  return { values, set, handle }
}

export function useWalletRecovery() {
  const context = useContext(WalletRecoveryContext)
  if (!context) {
    throw new Error(
      'useWalletRecovery must be used inside a WalletRecoveryContext Provider'
    )
  }
  return context
}

export type RecoveryContextProps = ReturnType<
  typeof useCreateWalletRecoveryContext
>

export type WalletRecoveryProviderProps = {
  value: RecoveryContextProps
  children: React.ReactNode
}
